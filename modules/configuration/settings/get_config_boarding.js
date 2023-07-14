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
async function getConfigEnvBoarding(base_args) {

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
    dummy_oauth: Boolean(values[0].dummy_oauth),
    log_stdout: Boolean(values[0].log_stdout),
    port: Number(values[0].port),
    routes: {
      url_api: JSON.parse(values[0].routes).url_api,
    },
    service: values[0].service,
    ui_module: values[0].service,
    max_filesize_byte : JSON.parse(values[0].max_filesize_byte)
  }
}


/////////////////////////
/**
 * Set env client for boarding
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigEnvClientBoarding(base_args) {

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

  //Get client_domain from Auth
  const client_domains = await ds_conf.controltower.getClientDomain(args)
  .catch(err=> {
    throw err
  })

  //Set env_client
  let env_client = {}
  for (let idx in values) {
    env_client[values[idx].client] = {
      client_domain : client_domains[values[idx].client],
      force_anonymous : Boolean(values[idx].force_anonymous),
      invoke_init_no_need : Boolean(values[idx].invoke_init_no_need),
      session_expire : {
        required : Boolean(values[idx].session_expire_required),
        time : JSON.parse(values[idx].session_expire_time),
      },
      signup_limitation : (values[idx].signup_limitation) ? JSON.parse(values[idx].signup_limitation) : null,
      operator : {
        system_name : values[idx].operator_system_name || null,
        response_time : (values[idx].operator_response_time)? JSON.parse(values[idx].operator_response_time) : null,
        stop_default_msg : JSON.parse(values[idx].operator_stop_default_msg) || null,
      },
      command_words: values[idx].command_words ? JSON.parse(values[idx].command_words) : null,
    }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  //Set env_client
  return env_client
}


/////////////////////////
/**
 * Set config anonymous tokens
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigAnonymousToken(base_args) {

  let args = {
    namespace : 'WhatYa-ControlTower-token',
    kind : 'anonymous',
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

  return {
    anonymous_token : values[0].token
  }
}


/////////////////////////
/**
 * Set config domain
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  * @param formation {*} for has client search  
*/
async function getConfigDomain(base_args, formation) {

  let args = {
    namespace : 'WhatYa-ControlTower-tokens_client',
    kind : 'tokens',
    ...base_args,
  }

  //Set revision
  const revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  const values = await ds_conf.controltower.getData(args)
  .catch(err=> {
    throw err
  })

  for (let idx in formation) {
    if (formation[idx]) {
      console.log()
    }
  }

  let list = {}
  for (let idx in values) {
    list[idx] = JSON.parse(values[idx].default_message)
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return domain

}


module.exports = {
  getConfigEnvBoarding,
  getConfigEnvClientBoarding,
  getConfigAnonymousToken,
  getConfigDomain,
}