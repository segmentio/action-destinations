import { DISPLAY_VIDEO_360_AUDIENCE_PARTNER_API_VERSION } from './versioning-info'

// accountType and advertiserID are used as markers to be replaced in the code. DO NOT REMOVE THEM.
export const BASE_URL = `https://audiencepartner.googleapis.com/${DISPLAY_VIDEO_360_AUDIENCE_PARTNER_API_VERSION}/products/accountType/customers/advertiserID/`
export const CREATE_AUDIENCE_URL = `${BASE_URL}userLists:mutate`
export const GET_AUDIENCE_URL = `${BASE_URL}audiencePartner:searchStream`
export const OAUTH_URL = 'https://accounts.google.com/o/oauth2/token'
export const USER_UPLOAD_ENDPOINT = 'https://cm.g.doubleclick.net/upload?nid=segment'
export const SEGMENT_DMP_ID = '1663649500'
