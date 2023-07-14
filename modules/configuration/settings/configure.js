const {
  getConfigFormation,
  getConfigProjectId,
  getConfigCommonVersion,
  getConfigCommon,
  getConfigTokensClient,
  getConfigApiConnect,
  getConfigKeelAuth,
} = require(`./get_config_commons`);

//Insert data module
const { insertComponentVersion } = require(`./insert_data`);


//Setting Common configures
class Configure {

  constructor(appli) {
    this.appli = appli;
  }

  /**
  * get appli configuration
  * @param base_args {
    * @param environment
    * @param appli_name
    * @param server_code
    * @param rivision
    * @param applyID
    * @param component_version
  * }
  */  
  async configurationCommon(base_args){
    try {
      let results = {}

      //formation
      results.formation = await getConfigFormation(base_args)

      //zzz fileter
      if (base_args.zzz && results.formation.length > 1) {
        for (let idx in results.formation) {
          if (results.formation[idx]?.zzz == base_args.zzz) {
            const formation = results.formation[idx]
            results.formation = []
            results.formation.push(formation);
            break;
          }
        }
      }

      //tokens client
      results.tokens_client = await getConfigTokensClient(base_args, results.formation)

      //for get formaion only care: set server code, appli name by appli_convert_name
      if (base_args.get_formation_only === true) {
        base_args.server_code = results.formation[0][base_args.appli_convert_name].server_code
        base_args.appli_name = base_args.appli_convert_name
      }

      //Keel access auth token
      results.keel_auth = await getConfigKeelAuth(base_args)

      //for get formaion only --> exit
      if (base_args.get_formation_only === true) return results;

      //project_id
      results.google_prj_id = await getConfigProjectId(base_args)

      //common(version)
      results.version = await getConfigCommonVersion(base_args)    

      //common(status_code, status_msg, dummy)  
      base_args.version = results.version
      results.common = await getConfigCommon(base_args)

      //api connect
      results.api_conn = await getConfigApiConnect(base_args)

      //Insert component version
      results.component_version = await insertComponentVersion(base_args)

      return results
    } catch (err) {
      throw err
    }      
  }

}

module.exports = {
  Configure, 
}