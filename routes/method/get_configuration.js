'use strict';

//Environment
const conf = require(`../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../modules/kvs/datastore/config');

//System modules
const express_res = conf.express_res

/*
 * execute appli_name specific configuration.
 * this function is used by ConfigurationAppli or ConfigurationCockpit.
 */
async function do_configuration(base_args, res, cm) {
  try {

    //Get configuration
    //appli_nameの指定によって呼ばれるServiceを切換
    //例1: boarding --> ServiceForBoarding
    //例2: keel --> ServiceForKeel
    let results = await cm.configuration(base_args)

    results.type = `Configuration(${base_args.appli_name})`
    results.status_code = code.SUCCESS_ZERO
    results.status = status.SUCCESS_ZERO
    results.approval = true

    //Response
    express_res.func(res, results)

  } catch (err) {
    throw err
  }
}

/**
 * Get configuration for appli
 * @param {*} req  [req] express obj 
 * @param {*} res  [req] express obj
 * @param {*} cm   [req] ConfigureManager
 */
const ConfigurationAppli = async (req, res, cm) => {

  //Get applyID
  const ns = `WhatYa-ControlTower-${req.query.server_code}-${req.query.environment}`
  const applyID = await ds_conf.common.createID(ns)

  let revisions
  //Get history revision(-->k8s rollout undo)
  if (req.query.commitid) revisions = await ds_conf.controltower.getHistoryRevision(req.query.appli_name, req.query.commitid)

  //Get Latest revision(-->new commitid)
  if (!revisions) revisions = await ds_conf.controltower.getNowRevision()

  //Set basement args
  //if environment is "pre", special convert to use.
  //取得したControlTower情報をApplyした履歴として取得し、最後にValidationを行うため、apply_history_resultsを準備
  //insertHistoryFlg: modules/kvs/datastore/queries.controltower.jsのinsertApplyHistoryを実行可否判定用プロパティ
  const base_args = {
    environment : (req.query.environment == 'pre')? 'prd' : req.query.environment,
    use : (req.query.environment == 'pre')? 'pre' : req.query.environment,
    appli_name : req.query.appli_name,
    server_code : req.query.server_code,
    revisions : revisions,
    applyID : applyID,
    apply_hostname : req.query.hostname || null,
    commitid : req.query.commitid || null,
    component_version : req.query.component_version,
    apply_history_results : [],
    insertHistoryFlg : req.body.insertHistoryFlg || true
  }

  await do_configuration(base_args, res, cm);
};

const ConfigurationCockpit = async (req, res, cm) => {
  //Get now revision
  const revisions = await ds_conf.controltower.getNowRevision()

  //Set basement args
  //if environment is "pre", special convert to use.
  //ConfigurationAppliとは、異なりget_config_cockpit.jsではApply履歴は実装していない
  //insertHistoryFlg: modules/kvs/datastore/queries.controltower.jsのinsertApplyHistoryを実行可否判定用プロパティ
  const base_args = {
    environment : (req.query.environment == 'pre')? 'prd' : req.query.environment,
    use : (req.query.environment == 'pre')? 'pre' : req.query.environment,
    appli_name : req.query.appli_name,
    client : req.query.client,
    cockpit_server_code: req.query.cockpit_server_code,
    revisions : revisions,
    insertHistoryFlg : req.body.insertHistoryFlg || false
  }

  await do_configuration(base_args, res, cm);
}

/**
 * Get configuration for appli
 * @param {*} req  [req] express obj 
 * @param {*} res  [req] express obj
 * @param {*} cm   [req] ConfigureManager
 */
const Formation = async (req, res, cm) => {

  //Get now revision
  const revisions = await ds_conf.controltower.getNowRevision()

  //Set basement args
  //ConfigurationAppliと同じく、get_config_commons.jsの処理を使うため、ControlTower情報取得した際に
  //これをApplyした履歴として取得しようとするが、get_formation_only=trueの判定をもって履歴を取らないように管理している
  //insertHistoryFlg: modules/kvs/datastore/queries.controltower.jsのinsertApplyHistoryを実行可否判定用プロパティ
  const base_args = {
    appli_name : 'formation',
    appli_convert_name : req.query.appli_name,
    environment : req.query.environment,
    client : req.query.client,
    revisions : revisions,
    get_formation_only : true,
    zzz : req.query.zzz, //duplicate client care, using zzz
    apply_history_results : [],
    insertHistoryFlg : req.body.insertHistoryFlg || false
  }

  try {

    //ServiceForFormation をCall
    let results = await cm.configuration(base_args)
    //console.log(results)

    results.type = `Configuration(${base_args.appli_name})`
    results.status_code = code.SUCCESS_ZERO
    results.status = status.SUCCESS_ZERO
    results.approval = true

    //Response
    express_res.func(res, results)

  } catch (err) {
    throw err
  }
};

/**
 * Get configure
 * @param {*} res  [req] express obj
 * @param {*} params [req] parameters
 * @param {*} cm   [req] ConfigureManager
 */
const GetConfigure = async (res, params, cm) => {

  //Get now revision
  const revisions = await ds_conf.controltower.getNowRevision()

  //Set basement args
  //Applyした履歴の取得はしない。指定した設定の取得の返却のみ
  const base_args = {
    ...params,
    revisions : revisions,
  }

  try {

    //ServiceForGetConfigure をCall
    let results = await cm.configuration(base_args)
    //console.log(results)

    results.type = `Configuration(${base_args.appli_name})`
    results.status_code = code.SUCCESS_ZERO
    results.status = status.SUCCESS_ZERO
    results.approval = true

    //Response
    express_res.func(res, results)

  } catch (err) {
    throw err
  }
};

module.exports = { 
  ConfigurationAppli,
  ConfigurationCockpit,
  Formation,
  GetConfigure,
 };