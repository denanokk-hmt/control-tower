'use strict';

//Environment
const ds_conf = require('../../kvs/datastore/config');


/////////////////////////
/**
 * Update finish in apply history
  * @param args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
    * @param apply_hostname
    * @param commitid
  * }
 */
async function updateFinish(args) {
  try {

    //Validation apply results
    const ns = 'WhatYa-ControlTower-apply_history'
    const kind = 'Histories'
    let revisions = await ds_conf.store.getEntityByKey(ns, kind, args.applyID.key.id, true)
    let error_kind
    for (let kind of args.apply_history_results) {
      if (!revisions[0][kind]) {
        error_kind = kind
        break
      }
    }

    //valiadtion error
    if (error_kind) {
      const log = {
        args : args,
        error : `kind [${error_kind}] is not Applied.`
      }
      console.error(JSON.stringify(log))
      throw(log.error)
    }

    args.finish = true
    await ds_conf.controltower.insertApplyHistory(args)
  } catch (err) {
    throw(err)
  }

  //resturn
  return 'finish'
}

module.exports = {
  updateFinish,
}
