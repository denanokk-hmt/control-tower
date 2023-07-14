'use strict';

//Environment
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');


/////////////////////////
/**
 * Set config formation
  * @param base_args {
    * @param environment
    * @param appli_name [get formaion: none]
    * @param server_code [get formaion: none]
    * @param rivision
    * @param applyID [get formaion: none]
    * @param client [get formaion: is]
  * }
*/
async function getConfigFormation(base_args) {

  //Get formation
  let args = {
    namespace : 'WhatYa-ControlTower-scheme',
    kind : 'formation',
    ...base_args,
  }

  //Set revision
  let revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]
  
  let values
  if (base_args.get_formation_only === true) {
    values = await ds_conf.controltower.getByUseClient(args)
    .catch(err=> {
      throw err
    })
  } else {
    values = await ds_conf.controltower.getByEnvAppli(args)
    .catch(err=> {
      throw err
    })
  }

  //Set formation
  let formation = []
  for (let idx in values) {
    formation.push(values[idx])
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  //Set args
  args.kind = 'server_code-server_domain'
  args.environment_noneed = false

  //Set revision
  revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  //Get appli server domain
  values = {}
  if (args.environment == 'pre') args.environment_noneed = true
  let domains = await ds_conf.controltower.getData(args)
  .catch(err=> {
    throw err
  })

  //Set appli server domain into formation
  for (let f_row in formation) {
    for (let prop in formation[f_row]) {
      for (let d_row in domains) {
        if (prop != domains[d_row].appli) continue;
        if (!formation[f_row][prop]) continue;
        if (formation[f_row][prop] === '--') continue;
        if (formation[f_row][prop] != domains[d_row].server_code) continue
        formation[f_row][prop] = { 
          domain : `${domains[d_row].server_code}-hmt-${domains[d_row].appli}.${domains[d_row].server_domain}`,
          server_code : domains[d_row].server_code
        }
        break
      }
    }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)
  
  //console.log(formation)
  return formation
}


/////////////////////////
/**
 * Get config Project id
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigProjectId(base_args) {

  let args = {
    namespace : 'WhatYa-ControlTower-project_id',
    kind : 'server_code-project_id',
    ...base_args,
    prop_name : 'appli',
    prop_value : base_args.appli_name,
  }

  //Set revision
  const revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  const values = await ds_conf.controltower.getByEnvSvrAnyprop(args)
  .catch(err=> {
    throw err
  })

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return values[0].id
}


/////////////////////////
/**
 * Set config Common version
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigCommonVersion(base_args) {

  let args = {
    namespace : 'WhatYa-ControlTower-common',
    kind : 'version',
    ...base_args,
    prop_name : 'appli',
    prop_value : base_args.appli_name,
  }

  //Set revision
  const revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]  

  const values = await ds_conf.controltower.getByEnvSvrAnyprop(args)
  .catch(err=> {
    throw err
  })

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return values[0].version
}


/////////////////////////
/**
 * Calculation　version for common
 */
function convert_version_cal(version) {
  let version_cal = version.replace(/_/,".").split(".")
  return Number(version_cal[0])*1000 + Number(version_cal[1])*100 + Number(version_cal[2])*10 
}
/**
 * Set config Common status
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigCommon(base_args) {

  let args = {
    namespace : 'WhatYa-ControlTower-common',
    kind : 'status',
    ...base_args,
    environment_noneed : true,
  }

  //Set revision
  const revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]  

  const values = await ds_conf.controltower.getData(args)
  .catch(err=> {
    throw err
  })

  const appli_version_cal = convert_version_cal(args.version)
  let status_code = {}
  let status_msg = {}
  let dummy = {}
  for (let idx in values) {
    let common_version_cal = convert_version_cal(values[idx].created_version)
    if (appli_version_cal >= common_version_cal) {
      status_code[values[idx].code_name] = values[idx].value
      status_msg[values[idx].code_name] = values[idx].msg
    }
    if (values[idx].code_name == 'DUMMY_RID') dummy.rid = values[idx].value
    if (values[idx].code_name == 'DUMMY_UID') dummy.uid = values[idx].value
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return {status_code, status_msg, dummy }
}


/////////////////////////
/**
 * Set config tokens client
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigTokensClient(base_args, formation) {

  let args = {
    namespace : 'WhatYa-ControlTower-tokens_client',
    kind : 'tokens',
    ...base_args,
  }

  //Set revision
  const revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  let values
  if (base_args.get_formation_only === true) {
    values = await ds_conf.controltower.getByUseClient(args)
    .catch(err=> {
      throw err
    })
  } else {
    values = await ds_conf.controltower.getByEnvUse(args)
    .catch(err=> {
      throw err
    })
  }

  let clients = []
  for (let idx in formation) {
    clients.push(formation[idx].client)
  }

  let tokens_client = {}
  for (let idx in values) {
    if (clients.indexOf(values[idx].client) == -1) continue;
    tokens_client[values[idx].client] = JSON.parse(values[idx].list)
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return {
    list : tokens_client
  }
}


/////////////////////////
/**
 * Set config api connect
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigApiConnect(base_args) {

  //Set bot api
  let args = {
    namespace : 'WhatYa-ControlTower-api_connect',
    kind : 'state-module',
    ...base_args,
    environment_noneed : true,
  }

  //Set revision
  let revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]  

  let values = {}
  values = await ds_conf.controltower.getData(args)
  .catch(err=> {
    throw err
  })

  let api_conn = {}
  for (let idx in values) {
    api_conn[values[idx].api_name] = JSON.parse(values[idx].module)
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  //Set operator api
  args = {
    namespace : 'WhatYa-ControlTower-api_connect',
    kind : 'server_code-operator',
    ...base_args,
  }

  //Set revision
  revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  values = await ds_conf.controltower.getByEnvSvr(args)
  .catch(err=> {
    throw err
  })

  if (values.length) {
    api_conn.operator = {}
    for (let idx in values) {
      api_conn.operator[values[idx].operator_system_name] = JSON.parse(values[idx].operator_system_config)
    }
  }

  if (values.length) {
    api_conn.operator_client = []
    for (let idx in values) {
      api_conn.operator_client.push({
        client : values[idx].client,
        system_name : values[idx].operator_system_name,
        operator_system_config : JSON.parse(values[idx].operator_system_config),
      })
    }
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return api_conn
}


/////////////////////////
/**
 * Set config Keel Auth token
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
*/
async function getConfigKeelAuth(base_args) {

  let args = {
    namespace : 'WhatYa-ControlTower-token',
    kind : 'keel_auth',
    ...base_args,
    prop_name : 'appli',
    prop_value : (base_args.prop_value)? base_args.prop_value : base_args.appli_name,
  }

  //Set revision
  const revision_name = `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}`
  args.revision = base_args.revisions[revision_name]

  let values
  if (base_args.get_formation_only === true) {
    values = await ds_conf.controltower.getByUseSvrAnyprop(args)
    .catch(err=> {
      throw err
    })
  } else {
    values = await ds_conf.controltower.getByEnvSvrAnyprop(args)
    .catch(err=> {
      throw err
    })
  }

  //Set result propname of apply history
  base_args.apply_history_results.push(revision_name)

  return { 
    token : values[0]?.token,
    hostnames : []
  }
}


module.exports = {
  getConfigFormation,
  getConfigProjectId,
  getConfigCommonVersion,
  getConfigCommon,
  getConfigTokensClient,
  getConfigApiConnect,
  getConfigKeelAuth,
}
