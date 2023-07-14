'use strict'
/*======================================
  ==Add [Appli] how to setting==
  ・config/list.jsonに[appli]を登録
  ・set_config_[appli].jsを追加
  ・configure modulesで、必要な関数をrequire
  ・class ServiceFor[apple]を追加
  ・set_config_[appli].jsから関数を呼び出す
  ・class ServiceFor[apple]をexport
  ・../index.jsでServiceFor[apple]をrequire
  ・../index.jsでServiceFor[apple]をservicesに登録{ [appli] : ServiceFor[apple] }
 **======================================
*/

//Register module
const { insertData } = require(`./settings/insert_data`);

//Configure Services
const { Configure } = require(`./settings/configure`)

//get config modules 
const { updateFinish } = require('./settings/update_finish');
const { getConfigEnvBoarding, getConfigEnvClientBoarding, getConfigAnonymousToken } = require(`./settings/get_config_boarding`);
const { getConfigEnvKeel, getConfigEnvClientKeel, getConfigDefautMessages } = require(`./settings/get_config_keel`);
const { getConfigEnvAsker, getConfigEnvClientAsker, getConfigAskerSpreadSheets } = require(`./settings/get_config_asker`);
const { getConfigEnvNewest, getConfigNewestSpreadSheets } = require(`./settings/get_config_newest`);
const { getConfigEnvP1, getConfigP1SpreadSheets } = require(`./settings/get_config_p1`);
const { getConfigEnvCargo, getConfigEnvClientCargo } = require(`./settings/get_config_cargo`);
const { getConfigEnvTransit, getConfigEnvClientTransit } = require(`./settings/get_config_transit`);
const { getConfigCockpit } = require('./settings/get_config_cockpit');
const { getConfigEnvCabin, getConfigSuffixCabin } = require('./settings/get_config_cabin');
const { getConfigEnvCatwalk, getConfigEnvClientCatwalk } = require(`./settings/get_config_catwalk`);
const { getConfigEnvWish, getConfigEnvClientWish } = require(`./settings/get_config_wish`);
const { getConfigEnvClientTugcar } = require(`./settings/get_config_tugcar`);
const { addClientToConfigures } = require('./additional/add_client_v2_servers');
const { GetConfigure } = require('./settings/get_configure');
const { copySpreadsheet } = require('./additional/copy_spreadsheet');
const { registerClientDomain } = require('./settings/register_client_domain');
const { revertClientToConfigures } = require('./additional/revert_client_v2_servers');


//////////////////////////////////
//Register
class ServiceForRegister extends Configure {

  /**
  * Insert spreadsheet data to storage
  * @param base_args {
    * @param appli_name
    * @param sheet_id
    * @param sheet_range
  * }
  */
  async configuration(base_args) {
    
    //Registre control tower data from spraeadsheets
    const result = await insertData(base_args)
    .catch(err=> {
      throw err
    })
    return result
  }
}


//////////////////////////////////
//Get Formation
class ServiceForFormation extends Configure {
  /**
  * Boarding configuration
  * @param base_args {
    * @param environment
    * @param rivision
  * }
  */
 async configuration(base_args) {
  try {
    //Get formation
    const results = await this.configurationCommon(base_args)

    return results
  } catch (err) {
    throw err
  }
}
}


//////////////////////////////////
//Boarding
class ServiceForBoarding extends Configure {
  /**
  * Boarding configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}

      //env for boarding
      results.env = await getConfigEnvBoarding(base_args)

      //env_client for boarding
      results.env_client = await getConfigEnvClientBoarding(base_args)

      //anonymous token
      results.anonymous_token = await getConfigAnonymousToken(base_args)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}


//////////////////////////////////
//Keel
class ServiceForKeel extends Configure {
  /**
  * Keel configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}

      //env for keel
      results.env = await getConfigEnvKeel(base_args)

      //env_client for keel
      results.env_client = await getConfigEnvClientKeel(base_args)

      //default messagese
      results.default_messages = await getConfigDefautMessages(base_args)

      //Asker Google spreadsheet
      results.asker_sheet_config = await getConfigAskerSpreadSheets(base_args, results.formation)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}


//////////////////////////////////
//Asker
class ServiceForAsker extends Configure {
  /**
  * Asker configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}

      //env for Asker
      results.env = await getConfigEnvAsker(base_args)      
      
      //env_client for Asker
      results.env_client = await getConfigEnvClientAsker(base_args)

      //Asker Google spreadsheet
      results.asker_sheet_config = await getConfigAskerSpreadSheets(base_args, results.formation)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}


//////////////////////////////////
//Newest
class ServiceForNewest extends Configure {
  /**
  * Newest configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}

      //env for Newest
      results.env = await getConfigEnvNewest(base_args)       

      //Newest Google spreadsheet
      results.newest_sheet_config = await getConfigNewestSpreadSheets(base_args, results.formation)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}


//////////////////////////////////
//P1
class ServiceForP1 extends Configure {
  /**
  * P1 configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}
      
      //env for P1
      results.env = await getConfigEnvP1(base_args)      

      //Newest Google spreadsheet
      results.p1_sheet_config = await getConfigP1SpreadSheets(base_args, results.formation)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}

//////////////////////////////////
//Cargo
class ServiceForCargo extends Configure {
  /**
  * Cargo configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}

      //env for cargo
      results.env = await getConfigEnvCargo(base_args)

      //env_client for cargo
      results.env_client = await getConfigEnvClientCargo(base_args)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}

//////////////////////////////////
//Cargo
class ServiceForTransit extends Configure {
  /**
  * Cargo configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}

      //env for cargo
      results.env = await getConfigEnvTransit(base_args)

      //env_client for cargo
      results.env_client = await getConfigEnvClientTransit(base_args)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}

//////////////////////////////////
// Cockpit
class ServiceForCockpit {
  /**
  * Cargo configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code client_id must be stored.
    * @param rivisions
  * }
  */
  async configuration(base_args) {
    try {
      const result = await getConfigCockpit(base_args);
      return result;
    } catch (err) {
      throw err;
    }
  }
}

//////////////////////////////////
// Cabin
class ServiceForCabin extends Configure {
  /**
  * Cabin configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)

      // common.formation[]にenc_client-keelのsubscription_suffix を付与する
      await getConfigSuffixCabin(base_args, common);
      results = {...common}

      //env for cabin
      results.env = await getConfigEnvCabin(base_args)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results

    } catch (err) {
      throw err
    }
  }
}


//////////////////////////////////
//Cargo
class ServiceForCatwalk extends Configure {
  /**
  * Cargo configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}

      //env for catwalk
      results.env = await getConfigEnvCatwalk(base_args)

      //env_client for catwalk
      results.env_client = await getConfigEnvClientCatwalk(base_args)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}

////////////////////////////////// Wish

class ServiceForWish extends Configure {
  /**
  * Wish configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      // Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}

      // env for Wish
      results.env = await getConfigEnvWish(base_args)

      // update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}

//////////////////////////////////
//Tugcar
class ServiceForTugcar extends Configure {
  /**
  * Cargo configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
  * }
  */
  async configuration(base_args) {
    try {
      let results = {}

      //Common configures
      const common = await this.configurationCommon(base_args)
      results = {...common}

      //env_client for tugcar
      results.env_client = await getConfigEnvClientTugcar(base_args)

      //update apply finish flg(true)
      results.finish = await updateFinish(base_args)

      return results
    } catch (err) {
      throw err
    }
  }
}


//////////////////////////////////
// Add Client
class ServiceForAddClient extends Configure {
  /**
  * @param base_args {
    * @param ***
  * }
  */
  async configuration(base_args) {
    try {

      //Add new clients to ds
      const result = await addClientToConfigures(base_args)

      return result

    } catch (err) {
      throw err
    }
  }
}

//////////////////////////////////
// Get configure
class ServiceForGetConfigure {
  /**
  * @param base_args {
    * @param appli_name
    * @param rivision
  * }
  */
  async configuration(base_args) {
    try {

      //Add new clients to ds
      const result = await GetConfigure(base_args)

      return result

    } catch (err) {
      throw err
    }
  }
}

//////////////////////////////////
// Call Copy spreadsheet api
class ServiceForCopySpreadsheet {
  /**
  * @param base_args {
    * @param env
    * @param kind
    * @param client
    * @param series
  * }
  */
  async configuration(base_args) {
    try {

      //Add new clients to ds
      const result = await copySpreadsheet(base_args)

      return result

    } catch (err) {
      throw err
    }
  }
}

//////////////////////////////////
// Call register client domain
class ServiceForRegisterClientDomain {
  /**
  * @param base_args {
    * @param client
    * @param env
    * @param use
    * @param domains
  * }
  */
  async configuration(base_args) {
    try {

      //Rgister client domain for auth
      const result = await registerClientDomain(base_args)

      return result

    } catch (err) {
      throw err
    }
  }
}

//////////////////////////////////
// Revert Client
class ServiceForRevertClient extends Configure {
  /**
  * @param base_args {
    * @param ***
  * }
  */
  async configuration(base_args) {
    try {

      //Revert new clients to ds
      const result = await revertClientToConfigures(base_args)

      return result

    } catch (err) {
      throw err
    }
  }
}

module.exports = {
  ServiceForRegister,
  ServiceForFormation,
  ServiceForBoarding,
  ServiceForKeel,
  ServiceForAsker,
  ServiceForNewest,
  ServiceForP1,
  ServiceForCargo,
  ServiceForTransit,
  ServiceForCockpit,
  ServiceForCabin,
  ServiceForCatwalk,
  ServiceForWish,
  ServiceForTugcar,
  ServiceForAddClient,
  ServiceForGetConfigure,
  ServiceForCopySpreadsheet,
  ServiceForRegisterClientDomain,
  ServiceForRevertClient,
}
