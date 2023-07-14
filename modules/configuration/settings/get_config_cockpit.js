'use strict';

//Environment
const conf = require(`../../../config/configure.js`);
const code = conf.status_code
const status = conf.status
const ds_conf = require('../../kvs/datastore/config');
const { datastore } = require('../../kvs/datastore/store');

/*
 * get formation info by { client, environment, cockpit_server_code}
 */
async function getFormationByClient(base_args) {
  const { client, cockpit_server_code, environment, use, revisions } = base_args;
  const ns = 'WhatYa-ControlTower-scheme';
  const kind = 'formation';

  datastore.namespace = ns;
  const query = datastore.createQuery(kind)
    .filter('revision', '=', revisions['scheme-formation'])
    .filter('environment', '=', environment)
    .filter('use', '=', use)
    .filter('client', '=', client)
    .filter('boarding', '=', cockpit_server_code);

  const results = (await datastore.runQuery(query))[0];
  if (results.length == 0) {
    throw new Error(`no results from formation for {${use}, ${client}, ${cockpit_server_code}}`);
  } else if (results.length != 1) {
    throw new Error(`got more then 1 results from formation for {${use}, ${client}, ${cockpit_server_code}}`);
  }
  return results[0];
}

/**
 * 
 * @param {Object} base_args 
 * @param {string} server_code 
 * @param {string} appli 'boarding' or 'cabin'
 */
async function getServerDomain(base_args, server_code, appli) {
  const { environment, use, revisions } = base_args;
  const ns = 'WhatYa-ControlTower-scheme';
  const kind = 'server_code-server_domain';

  datastore.namespace = ns;
  const query = datastore.createQuery(kind)
    .filter('revision', '=', revisions['scheme-server_code-server_domain'])
    .filter('environment', '=', environment)
    .filter('use', '=', use)
    .filter('server_code', '=', server_code)
    .filter('appli', '=', appli)

  const results = (await datastore.runQuery(query))[0];
  if (results.length == 0) {
    throw new Error(`no results from server_domain for {${use}, ${server_code}, ${appli}}`);
  } else if (results.length != 1) {
    throw new Error(`got more then 1 results from server_domain for {${use}, ${server_code}, ${appli}}`);
  }
  return `${server_code}-hmt-${appli}.${results[0].server_domain}`;
}

async function getConfigCockpit(base_args) {
  let boarding, cabin;
  const formation = await getFormationByClient(base_args);
  if (! formation.lb_domain) {
    const environment = base_args.environment;
    if (environment == 'prd') {
      throw new Error("lb_domain is empty");
    }
    // obtain server domain name from 'server_code-server_domain'
    const boarding_host = await getServerDomain(base_args, formation.boarding, 'boarding');
    boarding = {
      host: `https://${boarding_host}`,
      path: `/hmt/${base_args.client}`,
    };

    if (formation.cabin) {
      const cabin_host = await getServerDomain(base_args, formation.cabin, 'cabin');
      cabin = {
        host: `https://${cabin_host}`,
        path: '/cabin/connect',
      };
    } else {
      cabin = null;
    }
  } else {
    boarding = {
      host: `https://${formation.lb_domain}`,
      path: `/hmt/${base_args.client}`,
    };
    cabin = {
      host: `https://${formation.lb_domain}`,
      path: '/cabin/connect',
    };
  }

  return {
    boarding, cabin,
  };
}

module.exports = {
  getConfigCockpit,
}
