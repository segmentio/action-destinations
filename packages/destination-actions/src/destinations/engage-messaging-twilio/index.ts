/**
 * Since this is path is also registered in integrations: https://github.com/segmentio/integrations/blob/7779ada5bff3ab27212f02b8dca6d169552c9aca/integrations/index.js#L256
 * I have to use this proxy module under this path to avoid the following error happening in runtime error after deployment:
 * RetryableError: Could not load version 3.187.1-CHANNELS-657.1 of actions-personas-messaging-twilio, retrying
    at ActionVersionManager.importAndRegisterDestination (/usr/src/integrations/createActionDestination/actionVersionManager.js:177:19)
    at ActionVersionManager.retrieveIntegration (/usr/src/integrations/createActionDestination/actionVersionManager.js:130:18)

 */
import destination from '../engage/twilio'
export default destination
export * from '../engage/twilio'
