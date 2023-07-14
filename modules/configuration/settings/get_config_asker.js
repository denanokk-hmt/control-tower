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
async function getConfigEnvAsker(base_args) {

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
  }
}


/////////////////////////
/**
 * Set env client for asker
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigEnvClientAsker(base_args) {

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
    env_client[values[idx].client] = JSON.parse(values[idx].sign_newest)
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return env_client
}


/////////////////////////
/**
 * Set config Asker Spreadsheets
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  * @param formation
*/
async function getConfigAskerSpreadSheets(base_args, formation) {

  //Get Asker config spreadsheet data
  let args = {
    namespace : 'WhatYa-ControlTower-spreadsheet',
    kind : 'asker_config',
    ...base_args,
  }

  //Set revision
  let revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  let values = await ds_conf.controltower.getData(args)
  .catch(err=> {
    throw err
  })

  let clients = []
  for (let idx in formation) {
    clients.push(formation[idx].client)
  }

  let asker_config = {}
  for (let idx in values) {

    //Select client code
    if (clients.indexOf(values[idx].client) == -1) continue;      

    //Set asker config 
    asker_config[values[idx].client] = {
      credentials : {
        id : values[idx].id,
        range : JSON.parse(values[idx].credentials)
      },
      config : {
        id : values[idx].id,
        range : JSON.parse(values[idx].config)
      },
      default_messages : {
        id : values[idx].id,
        range : JSON.parse(values[idx].default_messages)
      },     
    }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  //Get Asker response spreadsheet data
  args.kind = 'asker_response'

  //Set revision
  revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  values = await ds_conf.controltower.getData(args)
  .catch(err=> {
    throw err
  })

  for (let idx in values) {
    
    //Select client code
    if (clients.indexOf(values[idx].client) == -1) continue;

    //Set asker response
    asker_config[values[idx].client].response = {
      id : values[idx].id,
      range : JSON.parse(values[idx].response)
    }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return asker_config
}


module.exports = {
  getConfigEnvAsker,
  getConfigEnvClientAsker,
  getConfigAskerSpreadSheets,
}
