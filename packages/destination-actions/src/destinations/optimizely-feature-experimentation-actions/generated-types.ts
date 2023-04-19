// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The personal access token will be used to submit a GDPR delete request to Optimizely. To generate a personal access token, navigate to Profile->API Access and generate a new token.
   */
  accessToken?: string
  /**
   * In order to use Optimizely Feature Experimentation (Actions) via server side, you must enter your Account ID from your Optimizely account. You can find this ID by visiting https://app.optimizely.com/v2/accountsettings/account/plan
   */
  accountId: string
  /**
   * The datafile is a JSON representation of the current state of flags and experiments for an environment in your Full Stack project. It should look something like https://cdn.optimizely.com/json/9218021209.json
   */
  dataFileUrl: string
  /**
   * To optimize the server side integration, we will cache the fetched Datafile that you have provided for this amount of time (in seconds) in Redis. Since the datafile should not change unless you modified the conditions or variation rules of your experiments, it is advised to have a minimum floor of 300 seconds (5 minutes).
   */
  cacheExp?: number
}
