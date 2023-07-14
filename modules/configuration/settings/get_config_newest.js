'use strict';

//Environment
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');

//common configures
const { } = require('./get_config_commons')


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
async function getConfigEnvNewest(base_args) {

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
  }
}


/////////////////////////
/**
 * Set config newest Spreadsheets
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  * @param formation {*}
*/
async function getConfigNewestSpreadSheets(base_args, formation) {

  //Get Asker config spreadsheet data
  let args = {
    namespace : 'WhatYa-ControlTower-spreadsheet',
    kind : 'newest',
    ...base_args,
  }

  //Set revision
  const revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  const values = await ds_conf.controltower.getData(args)
  .catch(err=> {
    throw err
  })

  let clients = []
  for (let idx in formation) {
    clients.push(formation[idx].client)
  }

  let spreadsheet = {}
  for (let idx in values) {
    //set range prop
    let prop_range = {}
    for (let idx2 in values[idx]) {
      if (idx2.match(/_range$/)) {
        prop_range[idx2.split("_")[0]] = values[idx][idx2]
      }
    }
    if (clients.indexOf(values[idx].client) == -1) continue;
    spreadsheet[values[idx].client] = { 
      id : values[idx].id,
      range : { ...prop_range }
    }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return spreadsheet
}


module.exports = {
  getConfigEnvNewest,
  getConfigNewestSpreadSheets,
}
