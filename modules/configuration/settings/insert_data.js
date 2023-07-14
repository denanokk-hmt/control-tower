'use strict';

//Environment
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');

//System modules
const spreadsheet = require(`../../linkage/google/spreadsheet-reader`)


/////////////////////////
/**
 * Insert Data
 * @param {*} base_args {
    * @param appli_name
    * @param sheet_id
    * @param sheet_range
    * @param sheet_revision_range
 * }
*/
const insertData = async (base_args) => {

  let entities = []
  let cnt = 0

  //////////////////////////
  //Get now revisions
  const now_revs = await ds_conf.controltower.getNowRevision()
  .catch(err =>{
    throw new Error(err.message)
  })

  //////////////////////////
  //Spreadsheet
  //Get spreadsheet data
  const spreadsheet_data = await spreadsheet.getSpreadSheetData(base_args.sheet_id, base_args.sheet_range)
  .then(results => {
    return results
  })
  .catch(err => {
    throw new Error(err.message)
  });

  let ns, kind
  let type_value = []
  let prop_nm = []
  let data = []
  for (let idx in spreadsheet_data) {

    //initial
    if (idx == 0) {
      for (let idx2 in spreadsheet_data[idx]) {

        //Revison checker
        if (idx2 == 0) {
          const sheet_rev = spreadsheet_data[idx][idx2];
          const now_rev = now_revs[`${base_args.ns}-${base_args.kind}`] || 0
          if (sheet_rev != now_rev) {
            const result = {
              type : "API",
              status_code : code.WAR_V_REV_DID_NOT_MATCH_105,
              status_msg : `Did not match revision. Please get latest configures. SHEET_REV:${sheet_rev}, DS_REV:${now_rev}`,
              sheet_rev: sheet_rev,
              ds_rev: now_rev,
              udt : new Date(),
            }
            return result
          }
        }

        //Set type_value
        type_value.push(spreadsheet_data[idx][idx2])
      }
      continue;
    } else if (idx == 1) {
      //Set property name
      for (let idx2 in spreadsheet_data[idx]) {
        prop_nm.push(spreadsheet_data[idx][idx2])
      }
      continue;
    }

    //Set each type values 
    let values = {}
    for (let idx2 in prop_nm) {
      switch (type_value[idx2]) {
        case "数値":
          values[prop_nm[idx2]] = Number(spreadsheet_data[idx][idx2])
          break
        case "Bool":
          let val = spreadsheet_data[idx][idx2]
          if (val == "FALSE" || val == "false" || val == "0") {
            values[prop_nm[idx2]] = false
          } else {
            values[prop_nm[idx2]] = Boolean(spreadsheet_data[idx][idx2])
          }
          break
        default:
          values[prop_nm[idx2]] = spreadsheet_data[idx][idx2] || null
      }
    }

    //Set Namespace & Kind for Datastore
    ns = values.ns
    kind = values.kind

    //Delete ns & kind from property values
    delete values.ns
    delete values.kind

    //Add create timestamp
    values['cdt'] = new Date();

    //Set insert data
    data.push(values)
  }

  //////////////////////////
  //Get new revision
  const rev = await ds_conf.controltower.setNewRevision(base_args.ns, base_args.kind)
  .catch(err =>{
    throw new Error(err.message)
  })

  //////////////////////////
  //Delete
  const old_rev = rev.prev - conf.env.delete_older_than

  //Get Data
  const args = {
    revision : old_rev,
    namespace : ns, 
    kind : kind,
    force : conf.delete_all_revisions,
  }
  const check = await ds_conf.controltower.getOldRevData(args)
  .catch(err =>{
    throw new Error(err.message)
  })

  //////////////////////////
  //Delete & Insert
  try {

    //Delete old data of all
    if (check.length) {
      entities = []
      cnt = 0
      for (let idx in check) {
        let id = check[idx][ds_conf.store.datastore.KEY].id
        entities[cnt] = ds_conf.controltower.deleteByID(ns, kind, id)
        cnt++
      }
      await Promise.all(entities).then(result => {
        result.forEach(entity => {
          console.log(`DELETE: ${ns}/${kind}`, entity.id)
        });
        return result
      })
    }

    //Insert New data
    entities = []
    cnt = 0
    for(let idx in data) {
      entities[cnt] = ds_conf.controltower.insertData(ns, kind, data[idx], rev.next)
      cnt++
    }
    await Promise.all(entities).then(result => {
      result.forEach(entity => {
        console.log(`INSERT: ${ns}/${kind}`, entity.key.id)
      });
      return result
    })

    //Update spradsheet revision --> Error: Insufficient Permissionになる今後の課題とする
    //await spreadsheet.updateSpreadSheetRange(base_args.sheet_id, base_args.sheet_revision_range, [rev.next])

  } catch(err) {
    throw err
  }

  console.log(`=========CONTROL TOWER INSERT DATA(DONE) TO DS ${ns}/${kind}===========`)

  return {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : `Success Insert Data ${ns}/${kind}`,
    revision: rev.next,
    udt : new Date(),
  }
}



/////////////////////////
/**
 * Insert component version
 * @param {*} base_args {
    * @param appli_name
    * @param server_code
    * @param component version
 * }
*/
const insertComponentVersion = async (base_args) => {

  //Set Namespace & Kind for Datastore
  const ns = 'WhatYa-ControlTower-common'
  const kind = 'component_version'
  const dt = new Date()

  const data = {
    environment	: base_args.environment,
    use	: base_args.use,
    server_code	: base_args.server_code,
    appli	: base_args.appli_name,
    version : base_args.component_version,
    udt : dt,
  }

  const result = await ds_conf.controltower.insertDataNoRev(ns, kind, base_args.server_code, data)
  .catch(err =>{
    throw new Error(err.message)
  })

  console.log(`=========CONTROL TOWER INSERT COMPPNENT VERSION(DONE) TO DS ${ns}/${kind}===========`)

  return {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : `Success Insert Component version ${ns}/${kind}`,
    udt : dt,
    result : JSON.stringify(result),
  }
}

module.exports = { insertData, insertComponentVersion }