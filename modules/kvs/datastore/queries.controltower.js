'use strict'

const ds_conf = require('./config.js');
const store = require('./store.js');


/**
 * Get revision new
 * @param {string} ns_type 
 * @param {string} kind
 * @param {string} stamp
 */
const setNewRevision = async (ns_type, kind, stamp) => {

  //namespace & kind
  const ns = `WhatYa-ControlTower-Revision`

  const tran = store.datastore.transaction()
  await tran.run()
  const key = tran.datastore.key({
    namespace: ns,
    path: [ 'Revisions', `${ns_type}-${kind}`],
  });

  let rev_prev = await tran.get(key)

  rev_prev = (rev_prev[0])? rev_prev[0].revision : 0
  const rev_next = rev_prev + 1

  //entity
  const data = [
    {
      name: 'revision',
      value: rev_next,
    },
    {
      name: 'cdt',
      value: new Date(),
    },
    {
      name: 'stamp',
      value: stamp || null,
    },
  ]
  const entity = {
    key: key,
    data: data,
  }
  //put entity
  return new Promise((resolve, reject) => {
    store.putEntity(entity, tran).then(result => {
      tran.commit()
      const entity = {
        prev : rev_prev,
        next : result.data[0].value
      }
      resolve(entity)
    })
    .catch(err => {
      console.log(err)
      tran.rollback()
      reject(err)
    })
  });
}
module.exports.setNewRevision = setNewRevision;

/**
 * Get revision now
 * @param {*} 
 */
const getNowRevision = async () => {

  //namespace & kind
  const ns = 'WhatYa-ControlTower-Revision'

  return new Promise((resolve, reject) => {
    //set namespace
    store.datastore.namespace = ns
    //set query
    const query = store.datastore
      .createQuery('Revisions')
    //run query
    store.datastore.runQuery(query)
      .then(results => {
        const entities = results[0];
        let revisions = {}
        entities.forEach(entity => {
          let name = entity[store.datastore.KEY].name
          let revision = entity.revision
          revisions[name] = revision
        });
        resolve(revisions);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getNowRevision = getNowRevision;

/**
 * Get revision history
 * @param {text} appli_name
 * @param {text} commitid
 * @param {bool} finish: default=true
 */
const getHistoryRevision = async (appli_name, commitid, finish=true) => {

  //namespace & kind
  const ns = 'WhatYa-ControlTower-apply_history'

  return new Promise((resolve, reject) => {
    //set namespace
    store.datastore.namespace = ns
    //set query
    const query = store.datastore
      .createQuery('Histories')
      .filter('commitid', '=', commitid)
      .filter('appli_name', '=', appli_name)
      .filter('finish', '=', finish)
      .limit(1);
    //run query
    store.datastore.runQuery(query)
      .then(results => {
        const entities = results[0];
        let revisions = {}
        if (results[0].length) {
          for (let prop in entities[0]) {
            revisions[prop] = entities[0][prop]
          }
        } else {
          revisions = null
        }
        resolve(revisions);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getHistoryRevision = getHistoryRevision;

/**
 * Get revisions stamp
 * @param {*} 
 */
const getRevisionsStamp = () => {
  return new Promise((resolve, reject) => {
    store.getEntityByKey(
      'WhatYa-ControlTower-Revision',
      'Revisions',
      'stamp',
      true
    )
    .then(results => {
      const entities = results[0];
      resolve(entities);
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  });
}
module.exports.getRevisionsStamp = getRevisionsStamp;

/**
 * Get revisions stamp
 * @param {string} client
 * @param {text} add_revert
 * @param {bool} progress
 */
const setRevisionsStamp = async (client, add_revert, progress) => {

  const dt = new Date()

  //namespace & kind
  const ns = `WhatYa-ControlTower-Revision`
  const stamp_value = `${client}_${add_revert}_${dt.getTime()}`

  const tran = store.datastore.transaction()
  await tran.run()
  const key = tran.datastore.key({
    namespace: ns,
    path: [ 'Revisions', `stamp`],
  });

  let stamp= await tran.get(key)

  //entity
  const data = [
    {
      name: 'revision',
      value: 0,
    },
    {
      name: 'cdt',
      value: dt,
    },
    {
      name: 'stamp',
      value: stamp_value || null,
    },
    {
      name: 'progress',
      value: progress || false,
    },
  ]
  const entity = {
    key: key,
    data: data,
  }
  //put entity
  return new Promise((resolve, reject) => {
    store.putEntity(entity, tran).then(result => {
      tran.commit()
      resolve({
        cdt : result.data[1].value,
        stamp : result.data[2].value,
        progress : result.data[3].value
      })
    })
    .catch(err => {
      console.log(err)
      tran.rollback()
      reject(err)
    })
  });
}
module.exports.setRevisionsStamp = setRevisionsStamp;

/**
 * Get old revision data
 * @param {*} namespace
 * @param {int} kind
 * @param {*} revision 
 */
const getOldRevData = ({namespace, kind, revision, force}) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = namespace

    //set Query
    let query
    if (force) {
      query = store.datastore
      .createQuery(kind)
    } else {
      query = store.datastore
      .createQuery(kind)
      .filter('revision', '<=', revision)
      //.limit(100);
    }


    //run query
    store.datastore.runQuery(query)
      .then(results => {
        const entities = results[0];      
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getOldRevData = getOldRevData;

/**
 * Insert history
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
    * @param apply_hostname
    * @param commitid
    * @param finish
    * @param {*} get_formation_only
  * }
 */
const insertApplyHistory = async (args) => {

  //get_formation: AskerシートからCall、revert_client: add_cleintシートからCall
  if (!args.insertHistoryFlg) return

  const ns = 'WhatYa-ControlTower-apply_history'
  const kind = 'Histories'

  //transaction
  const tran = ds_conf.store.datastore.transaction()
  await tran.run()

  //Get entity
  let prev_data = await ds_conf.store.getEntityByKey(ns, kind, args.applyID.key.id, true)

  //Set prop name
  let prop_name = (args.namespace)? `${args.namespace.replace(/WhatYa-ControlTower-/, '')}-${args.kind}` : null

  //Set entity key
  const key = store.datastore.key({
    namespace: ns,
    path: [ kind, args.applyID.key.id ],
  })

  //lock
  let history = await tran.get(key)

  //Set entity data
  let data = {}
  if (prev_data) data = { ...prev_data[0], }
  data.appli_name = args.appli_name
  data.environment = args.environment
  data.server_code = args.server_code
  data.cdt = new Date()
  data.apply_hostname = args.apply_hostname
  data.commitid = args.commitid
  if (prop_name) data[prop_name] = args.revision
  data.finish = args.finish || false

  //Conbine key & datas
  const entity = {
    key: key,
    data: data,
  }

  //exec query
  return new Promise((resolve, reject) => {
    store.putEntity(entity, tran).then(result => {
      tran.commit()
      resolve(result.key, result.data)
    })
    .catch(err => {
      console.log(err)
      tran.rollback()
      reject(err)
    })
  });
}
module.exports.insertApplyHistory = insertApplyHistory;

/**
 * Insert Spreadsheet config data
 * @param {*} namespace
 * @param {*} kind
 * @param {*} values
 * @param {*} revision
 */
const insertData = (namespace, kind, values, revision) => {

  //entity生成
  const key = store.datastore.key({
    namespace: namespace,
    path: [ kind ],
  })
  const data = {...values, revision}
  delete data.ns
  delete data.kind
  const entity = {
    key: key,
    data: data,
  }
  return new Promise((resolve, reject) => {
    store.putEntity(entity).then(result => {
      resolve(result)
    })
    .catch(err => {
      console.log(err)
      reject(err)
    })
  });
}
module.exports.insertData = insertData;


/**
 * Insert data no revision
 * @param {*} namespace
 * @param {*} kind
 * @param {*} name
 * @param {*} values
 */
const insertDataNoRev = (namespace, kind, name, values) => {

  //entity生成
  let key
  if (name) {
    key = store.datastore.key({
      namespace: namespace,
      path: [ kind, name ],
    })
  } else {
    key = store.datastore.key({
      namespace: namespace,
      path: [ kind ],
    })
  }

  const data = {...values}
  const entity = {
    key: key,
    data: data,
  }
  return new Promise((resolve, reject) => {
    store.putEntity(entity).then(result => {
      resolve(result)
    })
    .catch(err => {
      console.log(err)
      reject(err)
    })
  });
}
module.exports.insertDataNoRev = insertDataNoRev;

/**
 * Delete entity by id
 * @param {*} namespace
 * @param {*} kind
 * @param {*} id
 */
const deleteByID = (namespace, kind, id) => {

  id = Number(id)

  //Key生成
  const key = store.datastore.key({
    namespace: namespace,
    path: [ kind, id ],
  })

  return new Promise((resolve, reject) => {
    store.deleteEntity(key).then(result => {
      resolve(result)
    })
    .catch(err => {
      console.log(err)
      reject(err)
    })
  });
}
module.exports.deleteByID = deleteByID;

/**
 * Delete respomse
 * @param {*} namespace
 * @param {*} kind
 */
const deleteAll = (namespace, kind) => {

  //Key生成
  const key = store.datastore.key({
    namespace: namespace,
    path: [ kind ],
  })

  return new Promise((resolve, reject) => {
    store.deleteEntity(key).then(result => {
      resolve(result)
    })
    .catch(err => {
      console.log(err)
      reject(err)
    })
  });
}
module.exports.deleteAll = deleteAll;

/**
 * Get entity by no filter, or environment filter
 * @param {text} namespace
 * @param {text} kind
 * @param {int} revision 
 * @param {*} environment
 * @param {bool} environment_noneed 
 */
const getData = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    let query
    if (args.environment_noneed) {
      query = store.datastore
        .createQuery(args.kind)
        .filter('revision', '=', args.revision)
        //.limit(100);
    } else {
      query = store.datastore
        .createQuery(args.kind)
        .filter('revision', '=', args.revision)
        .filter('environment', '=', args.environment)
        //.limit(100);
    }

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        const entities = results[0];
        await insertApplyHistory(args) 
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getData = getData;

/**
 * Get entity by environment and dynamic appli name filters
 * @param {*} ns 
 * @param {*} kind 
 * @param {*} environment 
 * @param {*} appli_name 
 * @param {*} server_code
 * @param {*} revision
 */
const getByEnvAppli = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    const query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.revision)
      .filter('environment', '=', args.environment)
      .filter(args.appli_name, '=', args.server_code)
      //.order('mtime', { descending: true })

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        const entities = results[0];
        await insertApplyHistory(args)
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getByEnvAppli = getByEnvAppli;

/**
 * Get entity by environment & server code filters
 * @param {*} ns 
 * @param {*} kind 
 * @param {*} environment 
 * @param {*} server_code 
 */
const getByEnvSvr = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    const query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.revision)
      .filter('environment', '=', args.environment)
      .filter('server_code', '=', args.server_code)
      //.order('mtime', { descending: true })

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        const entities = results[0];   
        await insertApplyHistory(args)
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getByEnvSvr = getByEnvSvr;

/**
 * Get entity by environment & server code, any prop filters
 * @param {*} ns 
 * @param {*} kind 
 * @param {*} environment 
 * @param {*} appli_name 
 * @param {*} server_code
 * @param {*} prop_name
 * @param {*} prop_value
 */
const getByEnvSvrAnyprop = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    const query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.revision)
      .filter('environment', '=', args.environment)
      .filter('server_code', '=', args.server_code)
      .filter(args.prop_name, '=', args.prop_value)
      //.order('mtime', { descending: true })

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        const entities = results[0];
        await insertApplyHistory(args)
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getByEnvSvrAnyprop = getByEnvSvrAnyprop;

/**
 * Get entity by use & server code, any prop filters
 * @param {*} ns 
 * @param {*} kind 
 * @param {*} environment 
 * @param {*} appli_name 
 * @param {*} server_code
 * @param {*} prop_name
 * @param {*} prop_value
 */
const getByUseSvrAnyprop = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    const query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.revision)
      .filter('use', '=', args.environment)
      .filter('server_code', '=', args.server_code)
      .filter(args.prop_name, '=', args.prop_value)
      //.order('mtime', { descending: true })

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        const entities = results[0];
        await insertApplyHistory(args)
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getByUseSvrAnyprop = getByUseSvrAnyprop;

/**
 * Get entity by any prop filters
 * @param {*} ns 
 * @param {*} kind 
 * @param {*} prop_name
 * @param {*} prop_value
 */
const getByAnyprop = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    const query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.revision)
      .filter(args.prop_name, '=', args.prop_value)

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        const entities = results[0];
        await insertApplyHistory(args)
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getByAnyprop = getByAnyprop;

/**
 * Get entity by Use & Client
 * @param {*} ns 
 * @param {*} kind 
 * @param {*} use
 * @param {*} client
 */
const getByUseClient = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    const query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.revision)
      .filter('use', '=', args.environment)
      .filter('client', '=', args.client)

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        const entities = results[0];
        await insertApplyHistory(args)
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getByUseClient = getByUseClient;

/**
 * Get entity by Env & Use
 * @param {*} ns 
 * @param {*} kind 
 * @param {*} environment
 * @param {*} use 
 */
const getByEnvUse = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    const query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.revision)
      .filter('environment', '=', args.environment)
      .filter('use', '=', args.use)

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        const entities = results[0];
        await insertApplyHistory(args)
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getByEnvUse = getByEnvUse;

/**
 * Get entity by Client for add client
 * @param {*} ns 
 * @param {*} kind 
 * @param {*} client 
 */
const getByClientForAddClient = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    const query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.revision)
      .filter('client', '=', args.client)

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        let entities = results[0];
        entities.ns = args.namespace
        entities.kind = args.kind
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getByClientForAddClient = getByClientForAddClient;

/**
 * Get entity by revision
 * @param {*} ns 
 * @param {*} kind 
 * @param {*} rev
 * @param {*} client not required
 */
const getByRev = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = args.namespace

    //set Query
    let query
    if (!args.client) {
      query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.rev)
    } else {
      query = store.datastore
      .createQuery(args.kind)
      .filter('revision', '=', args.rev)
      .filter('client', '=', args.client)
    }

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        let entities = results[0];
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getByRev = getByRev;

/**
 * Insert(rewrite) client domain
 * @param {*} env
 * @param {*} use
 * @param {*} client_domain "["hmt.svc-api.com","lsupport.com"]"
 * @param {*} server_code
 */
const insertClientDomains = async (args) => {

  //time
  const dt = new Date()

  //transaction start
  const ns = `WhatYa-ControlTower-Auth`
  const kind = 'client_domain'
  const name = `${args.use}-${args.client}`
  const tran = store.datastore.transaction()
  await tran.run()
  const key = tran.datastore.key({
    namespace: ns,
    path: [ kind, name],
  });

  //Get now entity
  const now_domain = await tran.get(key)
  const cdt = (now_domain[0])? now_domain[0].cdt : dt;

  //entity
  const data = [
    {
      name: 'series',
      value: args.series,
    },    
    {
      name: 'server_code',
      value: args.server_code,
    },
    {
      name: 'client',
      value: args.client,
    },
    {
      name: 'env',
      value: args.env,
    },
    {
      name: 'use',
      value: args.use,
    },
    {
      name: 'client_domain',
      value: args.client_domain,
    },
    {
      name: 'enable',
      value: true,
    },
    {
      name: 'cdt',
      value: cdt,
    },
    {
      name: 'udt',
      value: dt,
    },
  ]
  const entity = {
    key: key,
    data: data,
  }
  //put entity
  return new Promise((resolve, reject) => {
    store.putEntity(entity, tran).then(result => {
      tran.commit()
      const entity = {
        client : result.data[0].value,
        client_domain : result.data[3].value
      }
      resolve(entity)
    })
    .catch(err => {
      console.log(err)
      tran.rollback()
      reject(err)
    })
  });
}
module.exports.insertClientDomains = insertClientDomains;

/**
 * Get client_domain
 * @param {*} ns
 * @param {*} kind
 * @param {*} environment
 * @param {*} use
 */
const getClientDomain = (args) => {
  return new Promise((resolve, reject) => {

    //Set namespace
    store.datastore.namespace = 'WhatYa-ControlTower-Auth'

    //set Query
    const query = store.datastore
      .createQuery('client_domain')
      .filter('use', '=', args.use)
      .filter('series', '=', args.series)

    //run query
    store.datastore.runQuery(query)
      .then(async results => {
        let entities = results[0];
        if (results[0].length) {
          results[0].forEach(e => {
            entities[e.client] = e.client_domain;
          });
        }
        resolve(entities);
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
}
module.exports.getClientDomain = getClientDomain;
