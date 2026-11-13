import { DISPLAY_VIDEO_360_AUDIENCE_PARTNER_API_VERSION } from './versioning-info'

// accountType and advertiserID are used as markers to be replaced in the code. DO NOT REMOVE THEM.
export const BASE_URL = `https://audiencepartner.googleapis.com/${DISPLAY_VIDEO_360_AUDIENCE_PARTNER_API_VERSION}/products/accountType/customers/advertiserID/`
export const CREATE_AUDIENCE_URL = `${BASE_URL}userLists:mutate`
export const GET_AUDIENCE_URL = `${BASE_URL}audiencePartner:searchStream`
export const OAUTH_URL = 'https://accounts.google.com/o/oauth2/token'
export const USER_UPLOAD_ENDPOINT = 'https://cm.g.doubleclick.net/upload?nid=segment'
export const SEGMENT_DMP_ID = '1663649500'
export const FLAGON_NAME_DATA_MANAGER = 'actions-dv360-use-data-manager-api'
export const DATA_MANAGER_BASE_URL = 'https://datamanager.googleapis.com/v1'
// 540 days, expressed in seconds as a Data Manager duration string.
export const DATA_MANAGER_MEMBERSHIP_DURATION = `${540 * 86400}s`
