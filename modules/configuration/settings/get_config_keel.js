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
 * }
*/
async function getConfigEnvKeel(base_args) {

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
    bot_uid: values[0].bot_uid,
    cloud_platform: values[0].cloud_platform,
    dev_config_client_id: values[0].dev_config_client_id,
    environment: (values[0].use == 'pre')? values[0].use : values[0].environment,
    kvs: {
      service: values[0].kvs_service, 
      dev: values[0].kvs_dev, 
      stg: values[0].kvs_stg,
      prd: values[0].kvs_prd,
    },
    local_dummy_mode: Boolean(values[0].local_dummy_mode),
    log_stdout: Boolean(values[0].log_stdout),
    port: Number(values[0].port),
    response_context_output: Boolean(values[0].response_context_output),
    routes: {
      url_api: JSON.parse(values[0].routes).url_api,
    },
    service: values[0].service,
    ui_module: values[0].service,
    subscription_suffix: values[0].subscription_suffix || null,
  }
}


/////////////////////////
/**
 * Set env client for keel
 * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
 * }
*/
async function getConfigEnvClientKeel(base_args) {

  ///////////////////////////////
  //Get env_client
  let args = {
    namespace : 'WhatYa-ControlTower-env_client',
    kind : base_args.appli_name,
    ...base_args,
  }

  //Set revision
  let revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  let values = {}
  values = await ds_conf.controltower.getByEnvSvr(args)
  .catch(err=> {
    throw err
  })

  //Set invoke_init
  let invoke_init = {}
  for (let idx in values) {
    invoke_init[values[idx].client] = { interval : JSON.parse(values[idx].invoke_init_interval) }
  }
  //Set invoke_init rbfaq
  let invoke_init_rbfaq = {}
  for (let idx in values) {
    invoke_init_rbfaq[values[idx].client] = { interval : JSON.parse(values[idx].invoke_init_interval_rbfaq || null) }
  }

  //Set operator
  let operator = {}
  for (let idx in values) {
    if (!values[idx].operator_system_name) continue;
    operator[values[idx].client] = {
      system_name : values[idx].operator_system_name,
      system_config : {
        credentials : JSON.parse(values[idx].operator_system_config_credentials),
        ...JSON.parse(values[idx].operator_system_config)
      }
    }
  }

  //Set attachment
  let attachment = {}
  for (let idx in values) {
    attachment[values[idx].client] = values[idx].attachment_config ? JSON.parse(values[idx].attachment_config) : null
  }

  //Set subscription_suffix
  let subscription_suffix = {}
  for (let idx in values) {
    subscription_suffix[values[idx].client] = values[idx].subscription_suffix;
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  ///////////////////////////////
  //Get api_routine
  args.namespace = 'WhatYa-ControlTower-api_connect'
  args.kind = 'state-client-api_routine'

  //Set revision
  revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  values = {}
  values = await ds_conf.controltower.getByEnvSvr(args)
  .catch(err=> {
    throw err
  })

  //Set api_routine
  let api_routine = {}
  for (let idx in values) {
    api_routine[values[idx].client] = { routine : JSON.parse(values[idx].api_routine) }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  ///////////////////////////////
  //Get google translage language
  args.namespace = 'WhatYa-ControlTower-api_connect'
  args.kind = 'client-google_translate'

  //Set revision
  revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  values = {}
  values = await ds_conf.controltower.getByEnvSvr(args)
  .catch(err=> {
    throw err
  })

  //Set google_translate_langage
  let google_translate_langage = {}
  for (let idx in values) {
    google_translate_langage[values[idx].client] = { 
      in : {
        source_lang : values[idx].in_source_lang,
        target_lang : values[idx].in_target_lang
      },
      out : {
        source_lang : values[idx].out_source_lang,
        target_lang : values[idx].out_target_lang
      },
    }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  ///////////////////////////////
  //return as env_client
  return {
    invoke_init,
    invoke_init_rbfaq,
    operator,
    api_routine,
    google_translate_langage,
    subscription_suffix,
    attachment,
  }
}


/////////////////////////
/**
 * Set config default messages
 * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
 * }
*/
async function getConfigDefautMessages(base_args) {

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

  let default_messages = {}
  for (let idx in values) {
    default_messages[args.server_code] = JSON.parse(values[idx].default_message)
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return default_messages
}


module.exports = {
  getConfigEnvKeel,
  getConfigEnvClientKeel,
  getConfigDefautMessages,
}
