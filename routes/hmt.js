'use strict';

//Environment
const conf = require(`../config/configure`);
const code = conf.status_code
const status = conf.status
const adf = conf.apiDefaultFunc


//Configuration Manager
const { ConfigManager } = require('../modules/configuration')
const cm = new ConfigManager()

//Basic
var express = require('express')
var router = express.Router()
const express_res = conf.express_res

//System module
const valid = require(`../modules/validation`)
const crypto = require(`../modules/crypto/crypto`)
const ds_conf = require('../modules/kvs/datastore/config');

//[routes modules]
const { InsertSpreadsheet } = require(`./method/get_insert_spreadsheet`)
const { ConfigurationAppli, ConfigurationCockpit, Formation, GetConfigure } = require(`./method/get_configuration`)
const { AddClient } = require(`./method/post_add_client`)
const { CopySpreadsheet } = require(`./method/get_copy_spreadsheet`)
const { RegisterClientDomain } = require(`./method/post_register_client_domain`)
const { RevertClient } = require(`./method/post_revert_client`)


/**
 * ///////////////////////////////////////////////////
 * Error Response
 * @param {*} err 
 * @param {*} next 
 */
function errHandle2Top(err, next) {
  const result = {
    type: "API",
    status_code: code.ERR_S_API_REQ_902,
    status_msg : status.ERR_S_API_REQ_902,
    approval: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
  }
  next(result)
}

/**
 * ///////////////////////////////////////////////////
 * Basic validation
 * @param {*} res
 * @param {*} params
 */
function basicValidation(res, params) {

  //Validation IsValue
  let valid_result
  valid_result = valid.isParamValue(params)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'IsValue valid error.'
  }

  //Validation Version auth
  valid_result = valid.versionAuth(params.version)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Version valid error.'
  }

  //Keel Auth
  valid_result = valid.tokenAuthKeel(params.appli_name, params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }
}

/**
 * ///////////////////////////////////////////////////
 * [[[For Developement]]]
 * Get Node process env
 */
router.get('/get/env', adf.firstSet, async function(req, res, next) {
  try {
    let result = process.env
    result.node_version = process.version
    express_res.func(res, result)

  } catch(err) {
    errHandle2Top(err, next)
    return 'spread sheet insert error'
  };
})

/**
 * ///////////////////////////////////////////////////
 * [[[For Developement]]]
 * Issue Token
 */
router.get('/get/token', adf.firstSet, async function(req, res) {

  //Parameter
  const params = {
    id : req.query.id,
    pw : req.query.pw,
  }

  //Validation IsValue
  let valid_result
  valid_result = valid.isParamValue(params)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'IsValue valid error.'
  }

  //Hash token made from id & pw
  const hashIdPw = await crypto.hashMac(params.id, params.pw)
  if (!hashIdPw.issue) {
    express_res.funcErr(res, hashIdPw.status, hashIdPw.status_code);
    return 'Token issue Error.';
  }

  //Create random seed 8
  const seed = (req.query.seed)? req.query.seed : crypto.seedRandom8()

  //Encrypt from seed & hashIdPw.token 
  console.log(`${seed}${hashIdPw.token}`)
  const encrypt = crypto.encrypt(`${seed}${hashIdPw.token}`)
  if (!encrypt.issue) {
    express_res.funcErr(res, encrypt.status, encrypt.status_code);
    return 'Encrypt error'  
  }

  //Response
  express_res.func(res, encrypt)
})

////////////////////////////////////////////////////////////
// Insert Spreadsheet data
// ControlTower情報を専用スプレッドシートから挿入する
////////////////////////////////////////////////////////////
router.get('/get/insert/spreadsheet', adf.firstSet, function(req, res, next) {
  
  //parameter
  const params = {
    appli_name : req.query.appli_name, //like keel
    version : req.query.version, //ct version
    token : req.query.token, //ct auth toke
    id :req.query.id, // spreadsheet id
    ns : req.query.ns, // ns of ds prefix. WhatYa-ControlTower-[ns]
    kind : req.query.kind, // kind name of ds
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Insert spreadsheet data
  InsertSpreadsheet(req, res, cm)
  .catch(err => {
    errHandle2Top(err, next)
    return 'spread sheet insert error'
  });
})

////////////////////////////////////////////////////////////
// Get configuration
// BackendサーバーをApply（Deploy）する際に、ControlTower情報を取得する
////////////////////////////////////////////////////////////
router.get('/get/configuration', adf.firstSet, function(req, res, next) {

  const appli_name = req.query.appli_name;
  let config_func;
  let params;
  if (appli_name !== 'cockpit') {
    config_func = ConfigurationAppli;
    //parameter
    params = {
      appli_name : appli_name,
      version : req.query.version,
      token : req.query.token,
      server_code : req.query.server_code,
      environment : req.query.environment,
      insertHistoryFlg : req.body.insertHistoryFlg || true
    }
  } else {
    config_func = ConfigurationCockpit;
    // set cockpit specific params
    params = {
      appli_name : appli_name,
      version : req.query.version,
      token : req.query.token,
      client: req.query.client,
      cockpit_server_code: req.query.cockpit_server_code,
      environment : req.query.environment,
      insertHistoryFlg : req.body.insertHistoryFlg || false
    }
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Get configuration data
  config_func(req, res, cm)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Get configuration error'
  });
})

////////////////////////////////////////////////////////////
// Get formation
// Formation情報のみを取得する（AskerのGAS系からCallされる）
////////////////////////////////////////////////////////////
router.get('/get/formation', adf.firstSet, function(req, res, next) {

  //parameter
  const params = {
    appli_name : req.query.appli_name,
    version : req.query.version,
    token : req.query.token,
    client : req.query.client,
    environment : req.query.environment,
    insertHistoryFlg : req.body.insertHistoryFlg || false
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Get configuration data
  Formation(req, res, cm)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Get formation error'
  });
})

////////////////////////////////////////////////////////////
// Post Add Client
// 新規でクライアント追加するときに利用（yokeからCallしている）
////////////////////////////////////////////////////////////
router.post('/post/add/client', adf.firstSet, function(req, res, next) {

  //parameter
  let params = {
    version : req.body.version,
    token : req.body.token, 
    appli_name : 'add_client',
    zzz : req.body.zzz,
    lb_domain : req.body.lb_domain,
    pre_svc : req.body.pre_svc,
    prd_svc : req.body.prd_svc,
    pre_client : req.body.pre_client,
    prd_client : req.body.prd_client,
    region : req.body.region,
    client : req.body.client,
    client_domain : req.body.client_domain,
    operator_system_name : req.body.operator_system_name,
    operator_system_configs : req.body.operator_system_configs,
    prd_token : req.body.prd_token,
    sheet_id_answers : req.body.sheet_id_answers,
    sheet_id_response : req.body.sheet_id_response,
    sheet_id_newest : req.body.sheet_id_newest,
    insertHistoryFlg : req.body.insertHistoryFlg || false
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //env_client/keel operator_system_config
  params.keel_operator_system_config_credentials = req.body.keel_operator_system_config_credentials || null

  //Add Client to configuraion
  AddClient(req, res, cm, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Add client to configuration error'
  });
})

////////////////////////////////////////////////////////////
// Get a configure
// query.kindに取得したいControlTower情報のみを取得する
////////////////////////////////////////////////////////////
router.get('/get/configure', adf.firstSet, function(req, res, next) {

  //parameter
  const params = {
    appli_name : req.query.appli_name,
    ns: req.query.ns,
    kind: req.query.kind,
    version : req.query.version,
    token : req.query.token,
    tokens : req.query.tokens,
    insertHistoryFlg : req.body.insertHistoryFlg || false
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Suoer Auth by tripple tokeen
  const tokens = params.tokens.split(',')

  //Keel Auth 1
  let valid_result = valid.tokenAuthKeel(params.appli_name, tokens[0])
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Keel Auth 2
  valid_result = valid.tokenAuthKeel(params.appli_name, tokens[1])
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //need fileter client
  params.client = req.query.client || null
  
  //Get configur
  GetConfigure(res, params, cm)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Get configure error'
  });
})

////////////////////////////////////////////////////////////
// Copy spreadsheet
// Asker回りや、Newestなどのスプレッドシートを作成する（GASからCall）
////////////////////////////////////////////////////////////
router.get('/get/copy/spreadsheet', adf.firstSet, function(req, res, next) {

  //parameter
  const params = {
    appli_name : req.query.appli_name, //copy_spreadsheet
    version : req.query.version, //2.0.x
    token : req.query.token,    
    env: req.query.env,
    kind: req.query.kind, //answers, response, newest...
    client: req.query.client,    
    series: req.query.series, //v2
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }
  
  //Copy spreadsheet
  CopySpreadsheet(res, cm, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Get configure error'
  });
})

////////////////////////////////////////////////////////////
// Post Sleep tester
// Sleepをテストさせる
////////////////////////////////////////////////////////////
router.post('/post/sleep/tester', adf.firstSet, async function(req, res) {
  const { sleep } = require(`../modules/sleep`)
  await sleep(res, req.body.sleep)
})


////////////////////////////////////////////////////////////
// Post register client domain
// クライアントへの許可ドメインを設定する（GASからCall）
////////////////////////////////////////////////////////////
router.post('/post/register/client/domain', adf.firstSet, function(req, res, next) {

  //parameter
  const params = {
    version : req.body.version,
    token : req.body.token,
    appli_name : 'register_client_domain',
    client : req.body.client,
    use : req.body.use,
    client_domain : req.body.client_domain,
    server_code : req.body.server_code,
    series : req.body.series,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Register client domain
  RegisterClientDomain(res, cm, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Register client domain error'
  });
})

////////////////////////////////////////////////////////////
// Initialize stamp
////////////////////////////////////////////////////////////
router.post('/post/initialize/stamp', adf.firstSet, async function(req, res, next) {
  try {   
    //Stamping init
    const stamp = await ds_conf.controltower.setRevisionsStamp('someone', 'init', false)
    .catch(err => {
      throw Error(err)
    })
    express_res.func(res, stamp)
  } catch(err) {
    errHandle2Top(err, next)
    return 'stamp initialize error'
  };
})

////////////////////////////////////////////////////////////
// Post revrt client
// Clientを削除する（GASからCall）
////////////////////////////////////////////////////////////
router.post('/post/revert/client', adf.firstSet, function(req, res, next) {

  //parameter
  let params = {
    version : req.body.version,
    token : req.body.token,
    appli_name : 'revert_client',
    prd_client : req.body.prd_client,
    zzz : req.body.zzz,
    insertHistoryFlg : req.body.insertHistoryFlg || false
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Revrt Client to configuraion
  RevertClient(req, res, cm, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Revrt client to configuration error'
  });
})

module.exports = router;