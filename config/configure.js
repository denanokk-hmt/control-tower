'use strict';

//NODE ENV
const hostname = process.env.HOSTNAME
exports.google_prj_id = (process.env.GOOGLE_PRJ_ID)? process.env.GOOGLE_PRJ_ID : 'bwing-230309'

console.log(`hostname:${hostname}`)

//Env setting
const env = require(`./env.json`);
module.exports.env = env;

//Direcotry pass
const dirpath =(process.env.NODE_ENV == 'prd')? '/home/dev' : '.'
module.exports.dirpath = dirpath

//modules
//const modules = require(`../modules/modules`)
//module.exports.modules = modules

//Common config
const common = require(`./common.json`);
module.exports.version = common.version;
module.exports.status_code = common.status_code
module.exports.status = common.status_msg
module.exports.dummy = common.dummy

//Validation
const valid = require(`../modules/validation`);
module.exports.valid = valid;

//keel auth
const keel_auth = require('./keel_auth.json');
module.exports.keel_auth = keel_auth;

//express response common
const express_res = require(`../routes/express_res`);
module.exports.express_res = express_res

const { apiDefaultFunc } = require('../modules/api_default_func')
module.exports.apiDefaultFunc = apiDefaultFunc


//////////////////////////////////////////////////////////
//Google Spread Sheets API

//GooglespreadSheets api credentials path
const google_sheets_credentials_path = `${dirpath}/config/google_sheets_api/credentials.json`;
module.exports.google_sheets_credentials = google_sheets_credentials_path

//GooglespreadSheets api token path
const google_sheets_token_path = `${dirpath}/config/google_sheets_api/token.json`;
module.exports.google_sheets_token = google_sheets_token_path