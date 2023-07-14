//config
const conf = require(`../config/configure`);
const env = conf.env

//System modules
const crypto = require(`./crypto/crypto`)
const {getIP} = require('./get_ip')


const apiDefaultFunc = {

  //End next
  Final : (req, res) => {
    try {
      console.log()
    } catch(err) {
      console.error(JSON.stringify(err))
    }
  },

  //Default Setting
  firstSet: (req, res, next) => {
    try {

      //Create logiD
      req.logiD = `${crypto.seedRandom8()}${(new Date).getTime()}`

      //API
      req.api = String(req.url.split('?')[0]).split('/').slice(1,).join('_').toUpperCase()

      //Get & set IP
      req.IP = getIP(req)

      //body or query parameter 
      const params = (req.method == 'GET')? req.query : req.body

      //Logging parameter
      console.log(`======${req.logiD} CONTROL TOWER ${req.api}:`, JSON.stringify(params))

      //Logging header
      console.log(`======${req.logiD} CONTROL TOWER HEADERS:`, JSON.stringify(req.headers))

      //IP
      console.log(`======${req.logiD} CONTROL TOWER REQUEST IP:`, req.IP)

      next()
    } catch(err) {
      console.error(JSON.stringify(err))
    }
  },

};
module.exports = {
  apiDefaultFunc
};