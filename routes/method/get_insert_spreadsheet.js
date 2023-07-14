'use strict';

//Environment
const conf = require(`../../config/configure.js`);
const code = conf.status_code
const status = conf.status

//System modules
const express_res = conf.express_res


/**
 * Insert Spreadsheet data
 * @param {*} req   [req] express obj 
 * @param {*} res   [req] express obj
 * @param {*} cm    [req] ConfigureManager
 */
const InsertSpreadsheet = async (req, res, cm) => {

  const range = (!req.query.range)? conf.env.default_range : req.query.range

  //Set basement args
  const base_args = {
    appli_name : 'register',
    sheet_id : req.query.id,
    sheet_range : `${req.query.kind}!${range}`,
    sheet_revision_range : `${req.query.kind}!${conf.env.default_revision_range}`,
    ns : req.query.ns,
    kind : req.query.kind,
  }

  try {

    //Insert spreadsheets data to datasotre
    let results = await cm.configuration(base_args)

    if (results.status_code != code.WAR_V_REV_DID_NOT_MATCH_105) {
      results.type = 'Configuration(Register)'
      results.status_code = code.SUCCESS_ZERO
      results.status = status.SUCCESS_ZERO
      results.approval = true
    }

    //Response
    express_res.func(res, results)
    
  } catch (err) {
    throw err
  }
};
module.exports = { InsertSpreadsheet };