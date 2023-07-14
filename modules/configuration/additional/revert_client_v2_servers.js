'use strict';

//System modules
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');
const crypto = require('../../crypto/crypto');


/////////////////////////
/**
 * Revert client
  * @param base_args {
    * @param {array} add_client_use_nss
    * @param {array} revisions
    * @param {text} prd_client
    * @pstsm {string} stamp
  * }
*/
async function revertClientToConfigures(base_args) {

  const dt = new Date()
  let results = []
  let revert_result = []
  let cnt = 0

  //////////////////////////
  //Revison up to latest of all configures (latest + 1)
  try {
    for (let ns_type in base_args.add_client_use_nss) {

      //Set namespace
      const ns = `WhatYa-ControlTower-${ns_type}`;

      for (let idx in base_args.add_client_use_nss[ns_type]) {

        //Set kind
        const kind = base_args.add_client_use_nss[ns_type][idx]
        const revision_name = `${ns.replace(/WhatYa-ControlTower-/, '')}-${kind}`

        //////////////////////////
        //Insert new revision entities
        let args = {
          ...base_args,
          namespace : ns,
          kind : kind,
          revision : base_args.revisions[revision_name],
          environment_noneed : true
        }

        //Get entity with now revision.
        const entities = await ds_conf.controltower.getData(args)

        //set new revision
        const rev = await ds_conf.controltower.setNewRevision(ns_type, kind, base_args.stamp)

        //Update(Insert) entity as next revison.
        results= []
        cnt = 0
        for(let entity of entities) {
          if (entity.client == base_args.prd_client && entity.zzz == base_args.zzz) continue
          entity.cdt = dt
          results[cnt] = ds_conf.controltower.insertData(ns, kind, entity, rev.next)
          cnt++;
        }
        //Promise
        await Promise.all(results).then(result => {
          result.forEach(entity => {
            console.log(`UPDATE(INSERT) REVISION:${rev.next}/${ns}/${kind}`, entity.key.id)
          });
          return result
        })

        //Set delete less than revision
        const old_rev = rev.prev - conf.env.delete_older_than

        //Get old Data
        args.revision = old_rev,
        args.force = conf.delete_all_revisions
        const check = await ds_conf.controltower.getOldRevData(args)

        //Delete old data of all by key id.
        if (check.length) {
          results= []
          cnt = 0
          for (let idx in check) {
            const id = check[idx][ds_conf.store.datastore.KEY].id
            results[cnt] = ds_conf.controltower.deleteByID(ns, kind, id)
            cnt++;
          }
          //Promise
          await Promise.all(results).then(result => {
            result.forEach(entity => {
              console.log(`DELETE OLDER:${ns}/${kind}`, entity.id)
            });
            return result
          })
        }

        //Get result
        revert_result.push(`finish revert:${rev.next}/${ns}/${kind}`, `client:${base_args.prd_client}`)
   
      }
    }
    console.log(`FINISH REVERT CLIENT EXECUTION!!`, `client:${base_args.prd_client}`)
  } catch(err) {
    throw new Error(err.message)
  }

  return {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : `Success Revert client ${base_args.prd_client}`,
    result : revert_result,
    udt : new Date(),
  }
}

module.exports = {
  revertClientToConfigures,
}