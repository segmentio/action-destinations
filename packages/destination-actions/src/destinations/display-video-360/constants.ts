export const GOOGLE_API_VERSION = 'v2'
// accountType and advertiserID are used as markers to be replaced in the code.
export const BASE_URL = `https://audiencepartner.googleapis.com/${GOOGLE_API_VERSION}/products/accountType/customers/advertiserID/`
export const CREATE_AUDIENCE_URL = `${BASE_URL}userLists:mutate`
export const GET_AUDIENCE_URL = `${BASE_URL}audiencePartner:searchStream`
export const OFFLINE_DATA_JOB_URL = `${BASE_URL}offlineUserDataJobs`
export const MULTI_STATUS_ERROR_CODES_ENABLED = true
export const OAUTH_URL = 'https://accounts.google.com/o/oauth2/token'
