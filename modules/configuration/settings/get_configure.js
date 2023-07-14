'use strict';

//Environment
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');


/////////////////////////
/**
 * Get configure
  * @param base_args {
    * @param appli_name
    * @param kind
    * @param ns
    * @param rivision
  * }
*/
async function GetConfigure(base_args) {

  let entities = []
  for (let idx in base_args.revisions) {
    
    //search ns & kind
    if (`${base_args.ns}-${base_args.kind}` != idx) continue;
    
    //Get configure
    const ns = idx.split('-')[0]
    const kind = idx.replace(`${ns}-`, '')    
    const rev = base_args.revisions[idx]
    const args = {
      namespace : `WhatYa-ControlTower-${ns}`,
      kind : kind,
      rev : rev,
      client : base_args.client, //not required
    }
    try {
      entities = await ds_conf.controltower.getByRev(args)
      break;
    } catch (err) {
      throw err
    }
  }

  //resturn
  return entities
}

module.exports = {
  GetConfigure,
}
