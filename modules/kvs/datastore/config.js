'use strict';

const conf = require(`../../../config/configure.js`);
const env = conf.env;

const KIND = {
  ID :              `ID`,              //ID採番用
};
module.exports.KIND = KIND;

const common = require(`./queries.common`)
module.exports.common = common

const controltower = require(`./queries.controltower`)
module.exports.controltower = controltower

const store = require(`./store`)
module.exports.store = store
