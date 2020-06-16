const axios = require('axios');
const async = require('async');
const { callbackify } = require('util');
const { login } = require('./shared');

function getApps() {
  return axios({
    method: 'GET',
    url: '/apps',
  }).then(({ data }) => {
    return data.filter(app => app.name.startsWith('JSSDK-') && app.organizationId === process.env.TEST_ORG_ID);
  }).catch((err) => {
    console.error(err.response.data);
  });
}

function cleanTestApps(items) {
  return Promise.all(items.map(item => {
    return axios({
      method: 'DELETE',
      url: `/apps/${item.id}`,
    }).catch((err) => {
      console.error(err.response.data);
    });
  }));
}

function getAuthServices() {
  return axios({
    method: 'GET',
    url: '/auth-services',
  }).then(({ data }) => {
    return data.filter(app => app.name.startsWith('JSSDK-') && app.identityStoreId === process.env.TEST_IDSTORE_ID);
  }).catch((err) => {
    console.error(err.response.data);
  });
}

function cleanAuthServices(items) {
  return Promise.all(items.map(item => {
    return axios({
      method: 'DELETE',
      url: `/auth-services/${item.id}`,
    }).catch((err) => {
      console.error(err.response.data);
    });
  }));
}

async.waterfall([
  callbackify(login),
  callbackify(getApps),
  callbackify(cleanTestApps),
  callbackify(getAuthServices),
  callbackify(cleanAuthServices)
]);
