'use strict';

//System modules
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');
const crypto = require('../../crypto/crypto');


/////////////////////////
/**
 * Add client
  * @param base_args {
    * @param {string} environment
    * @param {string} cluster_name
    * @param {string} server_code
    * @param {Number} ivision
    * @pstsm {string} stamp
  * }
*/
async function addClientToConfigures(base_args) {

  let prev_delete_key = [] //一度、現在のRevで追加したEntityを、全体更新の後に削除するためのKeyを格納
  let entities = []
  let results = []
  let cnt = 0
  
  //////////////////////////
  //Get template entities
  try {
    for (let idx in base_args.add_client_use_nss) {
      const ns = `WhatYa-ControlTower-${idx}`;
      for (let idx2 in base_args.add_client_use_nss[idx]) {

        //set kind
        const kind = base_args.add_client_use_nss[idx][idx2]
        const revision_name = `${ns.replace(/WhatYa-ControlTower-/, '')}-${kind}`

        //Get scheme formation
        const args = {
          namespace : ns,
          kind : kind,
          revision : base_args.revisions[revision_name],
          ...base_args,
        }

        //Get template entity
        entities[cnt] = ds_conf.controltower.getByClientForAddClient(args)
        cnt++
      }
    }
  } catch(err) {
    throw err;
  }
  const templates = await Promise.all(entities).then(results => {
    return results
  })

  //////////////////////////
  //Replace template entities
  entities = []
  cnt = 0
  for (let idx in templates) {
    const value = templates[idx]
    entities[cnt] = replaceTemplateWords({base_args, value}) //Replace template words
    .catch(err => {
      throw err
    });
    cnt++
  }
  //Promise
  entities = await Promise.all(entities).then(results => {
    return results
  })

  //////////////////////////
  //Convert type of value
  let dt = new Date();
  let data = []
  for (let rows of entities) {
    for (let row of rows.props) {
      let values = {}
      for (let idx in row) {
        switch (rows.types[idx]) {
          case "数値":
            values[idx] = Number(row[idx])
            break
          case "Bool":
            let val = row[idx]
            if (val == "FALSE" || val == "false" || val == "0") {
              values[idx] = false
            } else {
              values[idx] = Boolean(row[idx])
            }
            break
          default:
            values[idx] = row[idx] || null
        }
      }
      //Add common info
      values.cdt = dt
      values.udt = dt
      values.ns = rows.ns;
      values.kind = rows.kind;

      //Set insert data
      data.push(values)
    }
  }

  //////////////////////////
  //Insert new client config data as prev(now) revision
  results = []
  cnt = 0
  for (let entity of data) {
    try {
      results[cnt] = ds_conf.controltower.insertData(entity.ns, entity.kind, entity, entity.revision)
      cnt++;
    } catch(err) {
      throw new Error(err.message)
    }
  }
  //Promise
  await Promise.all(results).then(result => {
    result.forEach(entity => {
      prev_delete_key.push(entity.key.id)
      console.log(`INSERT CLIENT:${entity.key.namespace}/${entity.key.kind}`, entity.key.id)
    });
    return result
  })

  //////////////////////////
  //Revison up to latest of all configures (latest + 1)
  let insert_result = []
  entities = []
  dt = new Date()
  try {
    for (let ns_type in base_args.add_client_use_nss) {

      //Set namespace
      const ns = `WhatYa-ControlTower-${ns_type}`;

      for (let idx in base_args.add_client_use_nss[ns_type]) {

        //set kind
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
        entities = await ds_conf.controltower.getData(args)

        //set new revision
        const rev = await ds_conf.controltower.setNewRevision(ns_type, kind, base_args.stamp)

        //Update(Insert) entity as next revison.
        results= []
        cnt = 0
        for(let entity of entities) {
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

        //////////////////////////
        //Delete new insert trush entities
        results= []
        cnt = 0
        for (let id of prev_delete_key) {
          results[cnt] = ds_conf.controltower.deleteByID(ns, kind, id)
          cnt++;
        }
        //Promise
        await Promise.all(results).then(result => {
          result.forEach(entity => {
            console.log(`DELETE ADD CLIENT COPY TRUSH:${rev.prev} ${ns}/${kind}`, entity.id)
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
        insert_result.push(`finish insert:${rev.next}/${ns}/${kind}`, `client:${base_args.prd_client}`)
      }
    }
    console.log(`FINISH ADD CLIENT EXECUTION!!`, `client:${base_args.prd_client}`)
  } catch(err) {
    throw new Error(err.message)
  }

  return {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : `Success Add new client ${base_args.prd_client}`,
    result : insert_result,
    udt : new Date(),
  }
}

module.exports = {
  addClientToConfigures,
}

/**
 * Replave template words
 * @param {*} base_args
 * @param {*} template entities
 */
async function replaceTemplateWords(args) {

  let ns = args.value.ns
  let kind = args.value.kind
  let replaced = {        
    ns: ns,
    kind: kind
  }
  let types = {
    revision : 0
  }
  let props = []

  try {
    switch (true) {
      case ns == 'WhatYa-ControlTower-scheme' && kind == 'formation':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          const find = (template.use == 'pre')? 'PRE_SVC_' : 'PRD_SVC_'
          const replace = (template.use == 'pre')? args.base_args.pre_svc : args.base_args.prd_svc
          const boarding = replaser(template.boarding, find, replace.b)
          const keel = replaser(template.keel, find, replace.k)
          const newest = replace.n ? replaser(template.newest, find, replace.n) : null
          const asker = replaser(template.asker, find, replace.a)
          const cabin = (template.cabin && replace.c)? replaser(template.cabin, find, replace.c) : null
          const cargo = (template.cargo && replace.cg)? replaser(template.cargo, find, replace.cg) : null
          const transit = (template.transit && replace.t)? replaser(template.transit, find, replace.t) : null
          const catwalk = replace?.cw ? replaser(template.catwalk, find, replace.cw) : null
          const tugcar = replace?.tc ? replaser(template.tugcar, find, replace.tc) : null
          const lb_domain = replaser(template.lb_domain, 'LB_', args.base_args.lb_domain)
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const pre_client = replaser(template.pre_client, 'PRE_CLIENT', args.base_args.pre_client)
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            environment: template.environment,
            use: template.use,
            lb_domain,
            boarding,
            keel,
            newest,
            asker,
            cabin,
            cargo,
            transit,
            catwalk,
            tugcar,
            region: args.base_args.region,
            client,
            pre_client,
            series: template.series,
            zzz: zzz,
          })
        }      
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-api_connect' && kind == 'state-client-api_routine':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          const find = (template.use == 'pre')? 'PRE_SVC_' : 'PRD_SVC_'
          const replace = (template.use == 'pre')? args.base_args.pre_svc : args.base_args.prd_svc
          const server_code = replaser(template.server_code, find, replace.k)
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)  
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            appli: template.appli,
            environment: template.environment,
            use: template.use,
            server_code,
            client,
            api_routine: template.api_routine,
            series: template.series,
            zzz: zzz,
          })
        }
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-api_connect' && kind == 'server_code-operator':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          if (template.use == 'pre') continue;
          if (!args.base_args.prd_svc.c) continue;
          let find = (template.use == 'pre')? 'PRE_SVC_' : 'PRD_SVC_'
          const replace = (template.use == 'pre')? args.base_args.pre_svc : args.base_args.prd_svc
          const compo = template.server_code.split('_')[2]
          const server_code = replaser(template.server_code, find, replace[compo])
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const operator_system_name = replaser(template.operator_system_name, 'OP_SYSTEM_NAME', args.base_args.operator_system_name)
          find = `OP_SYSTEM_CONFIG_${template.appli.slice(0, 1).toUpperCase()}`; //_B or _K
          let operator_system_config = JSON.stringify(require(`./operator/${args.base_args.operator_system_configs}`)['api_connect'][operator_system_name][template.appli])
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            appli: template.appli,
            environment: template.environment,
            use: template.use,
            server_code,
            client,
            operator_system_name,
            operator_system_config,
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-env_client' && kind == 'boarding':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          const server_code = replaser(template.server_code, 'PRD_SVC_', args.base_args.prd_svc.b) //no need pre
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const client_domain = JSON.stringify(args.base_args.client_domain)
          const op_config = require(`./operator/${args.base_args.operator_system_configs}`)['env_client']['boarding']
          const signup_limitation = JSON.stringify(op_config["signup_limitation"])
          const operator_system_name = args.base_args.prd_svc.c ? replaser(template.operator_system_name, 'OP_SYSTEM_NAME', args.base_args.operator_system_name) : null
          const operator_stop_default_msg = args.base_args.prd_svc.c ? JSON.stringify(op_config["operator_stop_default_msg"]) : null
          const operator_response_time = args.base_args.prd_svc.c ? JSON.stringify(op_config["operator_response_time"]) : null
          const command_words = args.base_args.prd_svc.c ? JSON.stringify(op_config["command_words"]) : null
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            environment: template.environment,
            use: template.use,
            server_code,
            client,
            force_anonymous: template.force_anonymous,
            client_domain,
            session_expire_required: template.session_expire_required,
            session_expire_time: template.session_expire_time,
            invoke_init_no_need: template.invoke_init_no_need,
            signup_limitation,
            operator_system_name,
            operator_stop_default_msg,
            operator_response_time,
            command_words,
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-env_client' && kind == 'keel':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          let find = (template.use == 'pre')? 'PRE_SVC_' : 'PRD_SVC_'
          let replace = (template.use == 'pre')? args.base_args.pre_svc : args.base_args.prd_svc
          const server_code = replaser(template.server_code, find, replace.k)
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const operator_system_name = args.base_args.prd_svc.c ? replaser(template.operator_system_name, 'OP_SYSTEM_NAME', args.base_args.operator_system_name) : null
          const op_config = require(`./operator/${args.base_args.operator_system_configs}`)['env_client']['keel']
          let operator_system_config_credentials = args.base_args.prd_svc.c ? JSON.stringify(op_config["operator_system_config_credentials"]) : null
          if (args.base_args.prd_svc.c && args.base_args.keel_operator_system_config_credentials) {
            for (let idx in args.base_args.keel_operator_system_config_credentials) {
              if (idx == operator_system_name) {
                operator_system_config_credentials = JSON.stringify(args.base_args.keel_operator_system_config_credentials[idx])
                break;
              }
            }
          }
          const operator_system_config = args.base_args.prd_svc.c ? JSON.stringify(op_config["operator_system_config"]) : null
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            environment: template.environment,
            use: template.use,
            server_code,
            client,
            invoke_init_interval: template.invoke_init_interval,
            operator_system_name,
            operator_system_config_credentials,
            operator_system_config,
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-env_client' && kind == 'asker':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          let find = (template.use == 'pre')? 'PRE_SVC_' : 'PRD_SVC_'
          let replace = (template.use == 'pre')? args.base_args.pre_svc : args.base_args.prd_svc
          const server_code = replaser(template.server_code, find, replace.a)
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            environment: template.environment,
            use: template.use,
            server_code,
            client,
            sign_newest: template.sign_newest,
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-env_client' && kind == 'cargo':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          if (!args.base_args.prd_svc.cg) continue;
          const template = { ...args.value[idx] }
          const server_code = replaser(template.server_code, 'PRD_SVC_', args.base_args.prd_svc.cg) //no need pre
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const op_config = require(`./operator/${args.base_args.operator_system_configs}`)['env_client']['cargo']
          const storage_config = JSON.stringify(op_config["storage_config"])
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            environment: template.environment,
            use: template.use,
            server_code,
            client,
            storage_type: template.storage_type,
            storage_config,
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-env_client' && kind == 'transit':
        for (let idx in args.value) {
          if (!args.base_args.prd_svc.t) break;
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          const server_code = args.base_args.prd_svc.t ? replaser(template.server_code, 'PRD_SVC_', args.base_args.prd_svc.t) : null //no need pre
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const op_config = require(`./operator/${args.base_args.operator_system_configs}`)['env_client']['transit']
          const messenger_config = JSON.stringify(op_config["messenger_config"])
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            environment: template.environment,
            use: template.use,
            server_code,
            client,
            client_domain: template.client_domain,
            messenger_config,
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-env_client' && kind == 'catwalk':
          for (let idx in args.value) {
            if (idx == 'ns' || idx == 'kind') continue;
            const template = { ...args.value[idx] }
            let find = 'PRD_SVC_'
            let replace = args.base_args.prd_svc
            const server_code = replaser(template.server_code, find, replace.a)
            const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
            const zzz = args.base_args.zzz
            props.push({
              revision: template.revision,
              environment: template.environment,
              use: template.use,
              server_code,
              client,
              flightboards: template.flightboards,
              flightboard_roles: template.flightboard_roles,
              series: template.series,
              zzz: zzz
            })
          }
          replaced.props = props
          break;
        case ns == 'WhatYa-ControlTower-env_client' && kind == 'tugcar':
            for (let idx in args.value) {
              if (idx == 'ns' || idx == 'kind') continue;
              const template = { ...args.value[idx] }
              let find = 'PRD_SVC_'
              let replace = args.base_args.prd_svc
              const server_code = replaser(template.server_code, find, replace.a)
              const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
              const zzz = args.base_args.zzz
              props.push({
                revision: template.revision,
                environment: template.environment,
                use: template.use,
                server_code,
                client,
                series: template.series,
                zzz: zzz
              })
            }
            replaced.props = props
            break;
      case ns == 'WhatYa-ControlTower-tokens_client' && kind == 'tokens':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          let token = (template.use == 'prd')? await createToken() : require('./tokens_client_pre.json')['pre']
          const list = []
          const zzz = args.base_args.zzz
          list.push(token)
          props.push({
            revision: template.revision,
            environment: template.environment,
            use: template.use,
            client,
            region: args.base_args.region,
            list: JSON.stringify(list),
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-spreadsheet' && kind == 'asker_config':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const id = replaser(template.id, 'ANSWERS_SHEET_ID', args.base_args.sheet_id_answers)
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            environment: template.environment,
            use: template.use,
            client,
            type: template.type,
            id,
            credentials: template.credentials,
            config: template.config,
            default_messages: template.default_messages,
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;        
      case ns == 'WhatYa-ControlTower-spreadsheet' && kind == 'asker_response':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const id = replaser(template.id, 'RESPONSE_SHEET_ID', args.base_args.sheet_id_response)
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            environment: template.environment,
            use: template.use,
            client,
            type: template.type,
            id,
            response: template.response,
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;
      case ns == 'WhatYa-ControlTower-spreadsheet' && kind == 'newest':
        for (let idx in args.value) {
          if (idx == 'ns' || idx == 'kind') continue;
          const template = { ...args.value[idx] }
          const client = replaser(template.client, 'PRD_CLIENT', args.base_args.prd_client)
          const id = replaser(template.id, 'NEWEST_SHEET_ID', args.base_args.sheet_id_newest)
          const zzz = args.base_args.zzz
          props.push({
            revision: template.revision,
            environment: template.environment,
            client,
            type: template.type,
            id,
            Newest_range: template.Newest_range,
            WorthWords_range: template.WorthWords_range,
            series: template.series,
            zzz: zzz
          })
        }
        replaced.props = props
        break;
    }
  } catch(err) {
    throw err
  }
  //check type & setting
  for (let idx in replaced.props[0]) {
    types[idx] = checkType(replaced.props[0][idx])
  }
  replaced.types = types  
  return replaced
}

/**
 * Replace tempalete words
 * @param {text} str 
 * @param {text} find 
 * @param {text} replace 
 */
const replaser = (str, find, replace) => {
  try {
    const result = str.replace(find, replace)
    return result
  } catch(err) {
    throw err
  }
}

/**
 * Token creation
 */
const createToken = async () => {

  try {

    //Create id
    const id = Math.random().toString(32).substring(2)

    //Create pw
    const pw = Math.random().toString(32).substring(2)

    //Hash token made from id & pw
    const hashIdPw = await crypto.hashMac(id, pw)
    if (!hashIdPw.issue) {
      throw new Error(`${encrypt.status_code} : ${encrypt.status}`);
    }

    //Create random seed 8
    const seed = crypto.seedRandom8()

    //Encrypt from seed & hashIdPw.token 
    console.log(`${seed}${hashIdPw.token}`)
    const encrypt = crypto.encrypt(`${seed}${hashIdPw.token}`)
    if (!encrypt.issue) {
      throw new Error(`${encrypt.status_code} : ${encrypt.status}`);
    }

    //toString
    let token = encrypt.crypt.toString()

    //Replace + --> /
    token = token.replace(/\+/g, '/')
    
    return token
  } catch(err) {
    throw err
  }
}

const checkType = (val) => {
  const val_null = null
  try {
    if (val_null === val) {
      return "文字列"
    } else if (val.toString().toUpperCase() === "TRUE" || val.toString().toUpperCase() === "FALSE") {
      return "Bool"
    } else if (!isNaN(val)) {
      return "数値"
    } else {
      return "文字列"
    }
  } catch(err) {
    throw err
  }
}