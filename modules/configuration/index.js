
const add_client_use_nss = {
  scheme:         ['formation'],
  api_connect:    ['state-client-api_routine', 'server_code-operator'],
  env_client:     ['boarding', 'keel', 'asker', 'cargo', 'transit', "catwalk", "tugcar"],
  tokens_client:  ['tokens'],
  spreadsheet:    ['asker_config', 'asker_response', 'newest'],
}

const { 
  ServiceForRegister,
  ServiceForFormation,
  ServiceForKeel,
  ServiceForBoarding,
  ServiceForAsker,
  ServiceForNewest,
  ServiceForP1,
  ServiceForCargo,
  ServiceForTransit,
  ServiceForCockpit,
  ServiceForCabin,
  ServiceForAddClient,
  ServiceForGetConfigure,
  ServiceForCopySpreadsheet,
  ServiceForRegisterClientDomain,
  ServiceForRevertClient,
  ServiceForCatwalk,
  ServiceForWish,
  ServiceForTugcar,
} = require('./services')

const services = {
  register:   { service: ServiceForRegister, prop: 'process'},
  formation:  { service: ServiceForFormation, prop: 'function'},
  keel:       { service: ServiceForKeel, prop: 'appli'},
  boarding:   { service: ServiceForBoarding, prop: 'appli'},
  asker:      { service: ServiceForAsker, prop: 'appli'},
  newest:     { service: ServiceForNewest, prop: 'appli'},
  p1:         { service: ServiceForP1, prop: 'appli'},
  cargo:      { service: ServiceForCargo, prop: 'appli'},
  transit:    { service: ServiceForTransit, prop: 'appli'},
  cockpit:    { service: ServiceForCockpit, prop: 'appli'},
  cabin:      { service: ServiceForCabin, prop: 'appli'},
  catwalk:    { service: ServiceForCatwalk, prop: 'appli' },
  wish:       { service: ServiceForWish, prop: 'appli' },
  tugcar:    { service: ServiceForTugcar, prop: 'appli' },
  add_client: { service: ServiceForAddClient, prop: 'process'},
  get_configure: { service: ServiceForGetConfigure, prop: 'function'},
  copy_spreadsheet: { service: ServiceForCopySpreadsheet, prop: 'function'},
  register_client_domain: { service: ServiceForRegisterClientDomain, prop: 'function'},
  revert_client: { service: ServiceForRevertClient, prop: 'process'},
}

class ConfigManager {

  constructor() {
    this.appli = []
    for (let s in services) {
      this.appli.push({
        name: s,
        prop: services[s].prop
      })
    }
    this.add_client_use_nss = add_client_use_nss;
  }

  async configuration(base_args) {

    let cs
    for (let idx in services) {
      if (idx == base_args.appli_name) {
        cs = new services[idx].service(base_args)
        break;
      }
    }
    
    //Do configuration
    const configure = await cs.configuration(base_args)
    .catch(err => {
      throw err
    })
    return configure
  }

}

module.exports = {
  ConfigManager,
}