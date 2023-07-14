'use strict';

//Environment
const conf = require(`../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../modules/kvs/datastore/config');

//System modules
const express_res = conf.express_res


/**
 * Revert Client to configuration
 * @param {*} req     [req] express obj 
 * @param {*} res     [req] express obj
 * @param {*} cm      [req] ConfigureManager
 * @param {*} params  [req] paramesters
 */
const RevertClient = async (req, res, cm, params) => {
  try {

    //Get now revision
    const revisions = await ds_conf.controltower.getNowRevision()

    //Set args gor getting formation 
    //insertHistoryFlg: modules/kvs/datastore/queries.controltower.jsのinsertApplyHistoryを実行可否判定用プロパティ
    const args = {
      namespace: 'WhatYa-ControlTower-scheme',
      kind: 'formation',
      revision: revisions['scheme-formation'],
      environment: 'prd',
      client: params.prd_client,
      insertHistoryFlg : params.insertHistoryFlg
    }

    //Validation Exist client
    const formation = await ds_conf.controltower.getByUseClient(args)
    if (!formation.length) throw new Error(`Not has client: ${params.prd_client}`)

    //Stamp check. case of true is in progress
    let stamp = await ds_conf.controltower.getRevisionsStamp()
    .then(result => {
      if (result.progress) {
        const another_client = (result)? result.stamp.split('_')[0] : null
        throw new Error(`Not finish another add client process. ${another_client}`)
      }
      return result
    })
    .catch(err => {
      throw Error(err)
    })

    //Stamping on(inporgress)
    stamp = await ds_conf.controltower.setRevisionsStamp(params.prd_client, 'revert', true)
    .catch(err => {
      throw Error(err)
    })

    //Set basement args
    //insertHistoryFlg: modules/kvs/datastore/queries.controltower.jsのinsertApplyHistoryを実行可否判定用プロパティ
    const base_args = { 
      ...params,
      add_client_use_nss: cm.add_client_use_nss,
      revisions : revisions,
      stamp: stamp.stamp,
      insertHistoryFlg : params.insertHistoryFlg
    }

    //Inser new client to datastore 
    let results = await cm.configuration(base_args)

    results.type = 'Revert Client to configuration'
    results.status_code = code.SUCCESS_ZERO
    results.status = status.SUCCESS_ZERO
    results.approval = true

    //Stamping off(done))
    stamp = await ds_conf.controltower.setRevisionsStamp(params.prd_client, 'revert', false)
    .catch(err => {
      throw Error(err)
    })

    //Response
    express_res.func(res, results)
    
  } catch (err) {
    throw err
  }
};
module.exports = { RevertClient };
