'use strict';

//System modules
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');


/////////////////////////
/**
 * Register client domain
  * @param base_args {
    * @param client
    * @param env
    * @param use
    * @param domains

  * }
*/
async function registerClientDomain(base_args) {

  //Insert(Update) client domains
  const result = await ds_conf.controltower.insertClientDomains(base_args)
  .catch(err =>{
    throw new Error(err.message)
  })

  return {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : `Success register client domain ${base_args.client}`,
    result : result,
    udt : new Date(),
  }
}

module.exports = {
  registerClientDomain,
}  