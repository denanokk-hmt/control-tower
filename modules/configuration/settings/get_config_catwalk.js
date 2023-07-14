'use strict';

//Environment
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');


/////////////////////////
/**
 * Set config env
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigEnvCatwalk(base_args) {

  let args = {
    namespace : 'WhatYa-ControlTower-env',
    kind : base_args.appli_name,
    ...base_args,
  }

  //Set revision
  const revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  const values = await ds_conf.controltower.getByEnvSvr(args)
  .catch(err=> {
    throw err
  })

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  //Set env config
  return {
    bot_uid:　values[0].bot_uid,
    cloud_platform: values[0].cloud_platform,
    environment: (values[0].use == 'pre')? values[0].use : values[0].environment,
    kvs: {
      service: values[0].kvs_service, 
      dev: values[0].kvs_dev, 
      stg: values[0].kvs_stg,
      prd: values[0].kvs_prd,
    },
    origins: values[0].origins.split("\n"),
    s3env: JSON.parse(values[0].cps3),
    log_stdout: Boolean(values[0].log_stdout),
    port: Number(values[0].port),
    service: values[0].service,
    ui_module: values[0].service,
    staffs_domain: values[0].staffs_domain,
  }
}

/////////////////////////
/**
 * Set env client for catwalk
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigEnvClientCatwalk(base_args) {

  //Get env_client
  let args = {
    namespace : 'WhatYa-ControlTower-env_client',
    kind : base_args.appli_name,
    series : `v${base_args.version.split('.')[0]}`,
    ...base_args,
  }

  //Set revision
  const revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  let values
  values = await ds_conf.controltower.getByEnvSvr(args)
  .catch(err=> {
    throw err
  })

  //Set env_client
  let env_client = {}
  for (let idx in values) {
    // Make flightboard spec.
    const flightboards = JSON.parse(values[idx].flightboards)
    const flightboard_roles = JSON.parse(values[idx].flightboard_roles)
    const fb_compiled = {}
    for (const role in flightboard_roles) {
      fb_compiled[role] = []
      for (const board of flightboard_roles[role]) {
        fb_compiled[role].push(flightboards[board])
      }
    }

    env_client[values[idx].client] = {
      flightboards: fb_compiled
    }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return env_client
}


module.exports = {
  getConfigEnvCatwalk, getConfigEnvClientCatwalk
}