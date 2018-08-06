import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import { getConfig } from '../client';
import Kmd from '../kmd';
import { getActiveUser } from './session';

const AUTHORIZATION_HEADER = 'Authorization';
const X_KINVEY_REQUEST_START_HEADER = 'X-Kinvey-Request-Start';

function isNotString(val) {
  return !isString(val);
}

/**
 * @private
 */
export class Headers {
  constructor(headers) {
    this.headers = new Map();
    this.normalizedNames = new Map();

    if (headers) {
      if (headers instanceof Headers) {
        headers.keys().forEach((header) => {
          const value = headers.get(header);
          this.set(header, value);
        });
      } else {
        Object.keys(headers).forEach((header) => {
          const value = headers[header];
          this.set(header, value);
        });
      }
    }
  }

  has(name) {
    if (!isString(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    return this.headers.has(name.toLowerCase());
  }

  get(name) {
    if (!isString(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    return this.headers.get(name.toLowerCase());
  }

  keys() {
    return Array.from(this.normalizedNames.values());
  }

  set(name, value) {
    if (!isString(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    if ((!isString(value) && !isArray(value))
      || (isArray(value) && value.some(isNotString))) {
      throw new Error('Please provide a value. Value must be a string or an array that contains only strings.');
    }

    const key = name.toLowerCase();

    if (isArray(value)) {
      this.headers.set(key, value.join(','));
    } else {
      this.headers.set(key, value);
    }

    if (!this.normalizedNames.has(key)) {
      this.normalizedNames.set(key, name);
    }

    return this;
  }

  join(headers) {
    if (headers instanceof Headers) {
      headers.keys().forEach((header) => {
        const value = headers.get(header);
        this.set(header, value);
      });
    } else {
      Object.keys(headers).forEach((header) => {
        const value = headers[header];
        this.set(header, value);
      });
    }

    return this;
  }

  delete(name) {
    if (!isString(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    return this.headers.delete(name.toLowerCase());
  }

  toObject() {
    return this.keys().reduce((headers, header) => {
      // eslint-disable-next-line no-param-reassign
      headers[header] = this.get(header);
      return headers;
    }, {});
  }
}

export const Auth = {
  App: 'App',
  Client: 'Client',
  Session: 'Session'
};

/**
 * @private
 */
export class KinveyHeaders extends Headers {
  constructor(headers) {
    super(headers);

    // Add the Accept header
    if (!this.has('Accept')) {
      this.set('Accept', 'application/json; charset=utf-8');
    }

    // Add the X-Kinvey-API-Version header
    if (!this.has('X-Kinvey-Api-Version')) {
      this.set('X-Kinvey-Api-Version', '4');
    }
  }

  get requestStart() {
    return this.get(X_KINVEY_REQUEST_START_HEADER);
  }

  set auth(auth) {
    if (auth === Auth.App) {
      const { appKey, appSecret } = getConfig();
      const credentials = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
      this.set(AUTHORIZATION_HEADER, `Basic ${credentials}`);
    } else if (auth === Auth.Client) {
      const { clientId, appSecret } = getConfig();
      const credentials = Buffer.from(`${clientId}:${appSecret}`).toString('base64');
      this.set(AUTHORIZATION_HEADER, `Basic ${credentials}`);
    } else if (auth === Auth.Session) {
      const activeUser = getActiveUser();

      if (!activeUser) {
        throw new Error('No active user to authorize the request.');
      }

      const kmd = new Kmd(activeUser._kmd);
      this.set(AUTHORIZATION_HEADER, `Kinvey ${kmd.authtoken}`);
    } else {
      this.delete(AUTHORIZATION_HEADER);
    }
  }
}
