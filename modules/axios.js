'use strict';

const conf = require(`../config/configure`);
const code = conf.status_code
const axios = require('axios');


/**
 * Get method http request 
 * Need response return status_code, answer(contents of response)
 * @param {*} url
 * @param {*} params 
 */
const getRequest = async (url, params) => {
  try {
    return await axios({
      url: url, 
      params,
      headers: {
        'Content-Type': 'Accept: application/json',
      }
    })
    .then(function (response) {
      return response.data
    })
  } catch(err) {
    throw err
  }
};
module.exports.getRequest = getRequest;