'use strict';

//Environment
const conf = require(`../../config/configure.js`);
const code = conf.status_code
const status = conf.status

//System modules
const express_res = conf.express_res


/**
 * Register client domains
 * @param {*} res   [req] express obj
 * @param {*} cm    [req] ConfigureManager
 * @param {*} params
 */
const RegisterClientDomain = async (res, cm, params) => {

  //Set basement args
  const base_args = {
    ...params,
    env : (params.use == 'pre')? 'prd' : params.use,
  }

  try {

    //Insert spreadsheets data to datasotre
    let results = await cm.configuration(base_args)

    results.type = 'Register client doamin'
    results.status_code = code.SUCCESS_ZERO
    results.status = status.SUCCESS_ZERO
    results.approval = true

    //Response
    express_res.func(res, results)
    
  } catch (err) {
    throw err
  }
};
module.exports = { RegisterClientDomain };
