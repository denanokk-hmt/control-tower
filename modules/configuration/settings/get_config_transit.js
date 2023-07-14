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
async function getConfigEnvTransit(base_args) {

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

  //Set env config
  return {
    cloud_platform: values[0].cloud_platform,
    environment: (values[0].use == 'pre')? values[0].use : values[0].environment,
    kvs: {
      service: values[0].kvs_service, 
      dev: values[0].kvs_dev, 
      stg: values[0].kvs_stg,
      prd: values[0].kvs_prd,
    },
    log_stdout: Boolean(values[0].log_stdout),
    port: Number(values[0].port),
    routes: {
      url_api: JSON.parse(values[0].routes).url_api,
    },
    service: values[0].service,
    ui_module: values[0].service,
  }
}


/////////////////////////
/**
 * Set env client for cargo
 * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
 * }
*/
async function getConfigEnvClientTransit(base_args) {

  //Get env_client
  let args = {
    namespace : 'WhatYa-ControlTower-env_client',
    kind : base_args.appli_name,
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
    env_client[values[idx].client] = {
      client_domain: values[idx].client_domain,
      messenger: {
        config: JSON.parse(values[idx].messenger_config)
      },
    }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return env_client
}

module.exports = {
  getConfigEnvTransit,
  getConfigEnvClientTransit,
}
