'use strict';

//Environment
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');
const webclient = require('../../axios.js')

//common configures
const { } = require('../settings/get_config_commons')


/////////////////////////
/**
 * Call copy spreadsheet gas web script
  * @param base_args {
    * @param env
    * @param kind
    * @param client
    * @param series
  * }
  * }
*/
async function copySpreadsheet(base_args) {

  //Request gas script url
  const url = `https://script.google.com/macros/s/AKfycbz6Ur4mO-u5IMf9_JOeCiUIvbDKWSoklsaXy8fFNXtYzMGEcDI/exec`;

  //parameter
  const params = {
    env : base_args.env,
    kind : base_args.kind,
    client : base_args.client,
    series : base_args.series,
  }

  //Request Insert spreadsheets data.
  let response = await webclient.getRequest(url, params)
  .catch(err => {
    throw err
  });
  try {
    //data extraction form response html
    //GAS webapplication created html response...-->set split word in GAS web application.
    response = response.split('|||SPLIT|||')

    //check
    if (response[2].match(/GDRIVE_fileId/)) {
      return {
        GDRIVE_folderId : response[1].split(':')[1],
        GDRIVE_fileId : response[2].split(':')[1],
      }
    } else {
      throw new Error(`GDRIVE could not copy spreadsheet. ${response}`);
    }

  } catch (err) {
    throw err
  }
}

module.exports = {
  copySpreadsheet,
}
