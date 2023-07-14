'use strict';

const webclient = require("request");
const conf = require(`../config/configure`);
const code = conf.status_code


/**
 * Get newest response
 * Need response return status_code, answer(contents of response)
 * @param {*} url
 * @param {*} params 
 */
const getRequest = (url, params) => {
  return new Promise(function(resolve, reject) {
    webclient.get({
      url: url,
      headers: {
        'Content-Type': 'Accept: application/json',
      },
      qs: params
    }, function (error, response, body) {
      if (error) {
        reject(error)
      } else {
        try {
          const res = JSON.parse(body)
          resolve(res);
        } catch {
          reject("Server error")
        }
      }
    })
  })
}
module.exports.getRequest = getRequest;