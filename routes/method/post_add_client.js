'use strict';

//Environment
const conf = require(`../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../modules/kvs/datastore/config');

//System modules
const express_res = conf.express_res


/**
 * Add Client to configuration
 * @param {*} req     [req] express obj 
 * @param {*} res     [req] express obj
 * @param {*} cm      [req] ConfigureManager
 * @param {*} params  [req] paramesters
 */
const AddClient = async (req, res, cm, params) => {
  try {

    //Get now revision
    const revisions = await ds_conf.controltower.getNowRevision()

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
    stamp = await ds_conf.controltower.setRevisionsStamp(params.prd_client, 'add', true)
    .catch(err => {
      throw Error(err)
    })

    //Set basement args
    //insertHistoryFlg: modules/kvs/datastore/queries.controltower.jsのinsertApplyHistoryを実行可否判定用プロパティ
    const base_args = { 
      ...params,
      revisions : revisions,
      environment_noneed : true,  //getData時にrevisionだけでFilter
      add_client_use_nss: cm.add_client_use_nss,
      stamp: stamp.stamp,
      appli_name: params.appli_name,
      insertHistoryFlg : params.insertHistoryFlg
    }

    //Inser new client to datastore 
    let results = await cm.configuration(base_args)

    results.type = 'Add Client to configuration'
    results.status_code = code.SUCCESS_ZERO
    results.status = status.SUCCESS_ZERO
    results.approval = true

    //Stamping off(done))
    stamp = await ds_conf.controltower.setRevisionsStamp(params.prd_client, 'add', false)
    .catch(err => {
      throw Error(err)
    })

    //Response
    express_res.func(res, results)
    
  } catch (err) {
    throw err
  }
};
module.exports = { AddClient };
