'use strict';

//Environment
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const { datastore } = require('../../kvs/datastore/store');
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
async function getConfigEnvCabin(base_args) {

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
    service: values[0].service,
    ui_module: values[0].service,
  }
}

/**
 * env_client-keel の subscription_suffix を common.formation に付与する。
 * 
 * @param {*} base_args 
 * @param {*} common 
 */
async function getConfigSuffixCabin(base_args, common) {
  const { environment, use, revisions } = base_args;


  // formationの全ての keel の server_code を取り出す.
  // 基本的には server_code は一種類しか無いはず
  const keel_servercodes = [];
  const client_map = {}; // common.formation[x] への参照を保持する。キーは client値
  for (const item of common.formation) {
    client_map[item.client] = item;

    // keel の server_code を重複しないよう取り出す
    if (! keel_servercodes.includes(item.keel.server_code)) {
      keel_servercodes.push(item.keel.server_code)
    }
  }

  // env_client-keel から client 毎の subscription_suffix を抽出する
  datastore.namespace = 'WhatYa-ControlTower-env_client';
  for (const server_code of keel_servercodes) {
    const query = datastore.createQuery('keel')
      .filter('revision', '=', revisions['env_client-keel'])
      .filter('environment', '=', environment)
      .filter('series', '=', 'v2')
      .filter('use', '=', use)
      .filter('server_code', '=', server_code)

    const results = (await datastore.runQuery(query))[0]
    for (const keel_env of results) {
      const client = keel_env.client;

      if (! client_map[client]) {
        // keelが別のcabinを使っているケース。無視。
        continue
      }

      const suffix = keel_env.subscription_suffix;
      client_map[client].subscription_suffix = (suffix && suffix !== 'null') ? suffix : null;
    }
  }
  
  //Apply histopryに登録
  const args = {
    ...base_args,
    namespace : 'WhatYa-ControlTower-env_client',
    kind : 'keel',
    revision : revisions['env_client-keel'],
  }
  await ds_conf.controltower.insertApplyHistory(args)
}

module.exports = {
  getConfigEnvCabin,
  getConfigSuffixCabin,
}
