import { HttpMethod } from '../enums';
import Client from '../client';
import Device from '../device';
import Properties from './properties';
import url from 'url';
import { byteCount } from '../utils/string';
import assign from 'lodash/object/assign';
import result from 'lodash/object/result';
import clone from 'lodash/lang/clone';
import forEach from 'lodash/collection/forEach';
import isString from 'lodash/lang/isString';
import isPlainObject from 'lodash/lang/isPlainObject';
import isFunction from 'lodash/lang/isFunction';
import qs from 'qs';

/**
 * @private
 */
class Request {
  constructor(options = {}) {
    options = assign({
      method: HttpMethod.GET,
      headers: {
        Accept: 'application/json; charset=utf-8'
      },
      protocol: process.env.KINVEY_API_PROTOCOL || 'https:',
      host: process.env.KINVEY_API_HOST || 'baas.kinvey.com',
      pathname: '/',
      flags: {
        _: Math.random().toString(36).substr(2)
      },
      data: null,
      timeout: process.env.KINVEY_DEFAULT_TIMEOUT || 10000,
      followRedirect: true
    }, options);

    this.method = options.method;
    this.protocol = options.protocol;
    this.host = options.host;
    this.pathname = options.pathname;
    this.flags = qs.parse(options.flags);
    this.data = options.data || options.body;
    this.timeout = options.timeout;
    this.followRedirect = options.followRedirect;
    this.executing = false;

    const headers = options.headers && isPlainObject(options.headers) ? options.headers : {};

    if (!headers.Accept || !headers.accept) {
      headers.Accept = options.headers.Accept;
    }

    this.addHeaders(headers);
  }

  get method() {
    return this._method;
  }

  set method(method) {
    if (!isString(method)) {
      method = String(method);
    }

    method = method.toUpperCase();

    switch (method) {
      case HttpMethod.GET:
      case HttpMethod.POST:
      case HttpMethod.PATCH:
      case HttpMethod.PUT:
      case HttpMethod.DELETE:
        this._method = method;
        break;
      default:
        throw new Error('Invalid Http Method. Only GET, POST, PATCH, PUT, and DELETE are allowed.');
    }
  }

  get url() {
    return url.format({
      protocol: this.protocol,
      host: this.host,
      pathname: this.pathname
    });
  }

  get body() {
    return this.data;
  }

  set body(body) {
    this.data = body;
  }

  get data() {
    return this._data;
  }

  set data(data) {
    if (data) {
      const contentTypeHeader = this.getHeader('Content-Type');
      if (!contentTypeHeader) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    } else {
      this.removeHeader('Content-Type');
    }

    this._data = data;
  }

  getHeader(name) {
    if (name) {
      if (!isString(name)) {
        name = String(name);
      }

      const headers = this.headers || {};
      const keys = Object.keys(headers);

      for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];

        if (key.toLowerCase() === name.toLowerCase()) {
          return headers[key];
        }
      }
    }

    return undefined;
  }

  setHeader(name, value) {
    if (!name || !value) {
      throw new Error('A name and value must be provided to set a header.');
    }

    if (!isString(name)) {
      name = String(name);
    }

    const headers = this.headers || {};

    if (!isString(value)) {
      headers[name] = JSON.stringify(value);
    } else {
      headers[name] = value;
    }

    this.headers = headers;
  }

  addHeaders(headers) {
    if (!isPlainObject(headers)) {
      throw new Error('Headers argument must be an object.');
    }

    const names = Object.keys(headers);

    forEach(names, name => {
      const value = headers[name];
      this.setHeader(name, value);
    });
  }

  removeHeader(name) {
    if (name) {
      if (!isString(name)) {
        name = String(name);
      }

      const headers = this.headers || {};
      delete headers[name];
      this.headers = headers;
    }
  }

  clearHeaders() {
    this.headers = {};
  }

  isExecuting() {
    return this.executing ? true : false;
  }

  execute() {
    if (this.executing) {
      return Promise.reject(new Error('Unable to execute the request. The request is already executing.'));
    }

    this.executing = Promise.resolve().then(response => {
      this.executing = false;
      return response;
    }).catch(err => {
      this.executing = false;
      throw err;
    });

    return this.executing;
  }

  toJSON() {
    const json = {
      method: this.method,
      headers: this.headers,
      url: this.url,
      pathname: this.pathname,
      flags: this.flags,
      data: this.data,
      followRedirect: this.followRedirect
    };

    return clone(json, true);
  }
}

/**
 * @private
 */
export default class KinveyRequest extends Request {
  constructor(options = {}) {
    super(options);

    options = assign({
      client: Client.sharedInstance(),
      properties: null,
      auth: null,
      query: null
    }, options);

    if (!(options.client instanceof Client)) {
      options.client = new Client(result(options.client, 'toJSON', options.client));
    }

    this.properties = options.properties;
    this.client = options.client;
    this.auth = options.auth;
    this.query = options.query;

    const headers = {};
    headers['X-Kinvey-Api-Version'] = process.env.KINVEY_API_VERSION || 3;

    const device = new Device();
    headers['X-Kinvey-Device-Information'] = JSON.stringify(device.toJSON());

    if (options.contentType) {
      headers['X-Kinvey-Content-Type'] = options.contentType;
    }

    if (options.skipBL === true) {
      headers['X-Kinvey-Skip-Business-Logic'] = true;
    }

    if (options.trace === true) {
      headers['X-Kinvey-Include-Headers-In-Response'] = 'X-Kinvey-Request-Id';
      headers['X-Kinvey-ResponseWrapper'] = true;
    }

    this.addHeaders(headers);
  }

  set properties(properties) {
    if (properties) {
      if (!(properties instanceof Properties)) {
        properties = new Properties(result(properties, 'toJSON', properties));
      }

      const appVersion = properties.appVersion;

      if (appVersion) {
        this.setHeader('X-Kinvey-Client-App-Version', appVersion);
      } else {
        this.removeHeader('X-Kinvey-Client-App-Version');
      }

      const customProperties = result(properties, 'toJSON', {});
      delete customProperties.appVersion;
      const customPropertiesHeader = JSON.stringify(customProperties);
      const customPropertiesByteCount = byteCount(customPropertiesHeader);
      const customPropertiesMaxBytesAllowed = process.env.KINVEY_MAX_HEADER_BYTES || 2000;

      if (customPropertiesByteCount >= customPropertiesMaxBytesAllowed) {
        throw new Error(
          `The custom properties are ${customPropertiesByteCount} bytes.` +
          `It must be less then ${customPropertiesMaxBytesAllowed} bytes.`,
          'Please remove some custom properties.');
      }

      this.setHeader('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
    }
  }

  get client() {
    return this._client;
  }

  set client(client) {
    if (client) {
      this.protocol = client.protocol;
      this.host = client.host;
    }

    this._client = client;
  }

  execute() {
    const promise = super.execute().then(() => {
      return isFunction(this.auth) ? this.auth(this.client) : this.auth;
    }).then(authInfo => {
      if (authInfo) {
        let credentials = authInfo.credentials;

        if (authInfo.username) {
          credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
        }

        this.setHeader('Authorization', `${authInfo.scheme} ${credentials}`);
      }
    });

    return promise;
  }

  toJSON() {
    const json = super.toJSON();
    json.query = result(this.query, 'toJSON', this.query);
    return clone(json, true);
  }
}
