'use strict';

//Environment
const conf = require(`../../config/configure.js`);
const code = conf.status_code
const status = conf.status


//System modules
const express_res = conf.express_res


/**
 * Copy spreadsheet
 * @param {*} req     [req] express obj 
 * @param {*} res     [req] express obj
 * @param {*} cm      [req] ConfigureManager
 * @param {*} params  [req] paramesters
 */
const CopySpreadsheet = async (res, cm, params) => { 
  try {

    //Set basement args
    const base_args = { 
      ...params,
    }

    //Inser new client to datastore 
    let response = await cm.configuration(base_args)

    let results = {
      type : 'Copy spreadsheet',
      status_code : code.SUCCESS_ZERO,
      status_msg : status.SUCCESS_ZERO,
      approval : true,
      response
    }

    //Response
    express_res.func(res, results)
    
  } catch (err) {
    throw err
  }
};
module.exports = { CopySpreadsheet };
