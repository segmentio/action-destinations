import { TIKTOK_API_VERSION, TIKTOK_BASE_URL } from '../versioning-info'

export { TIKTOK_API_VERSION }
export const BASE_URL = TIKTOK_BASE_URL
export const CREATE_AUDIENCE_URL = `${BASE_URL}${TIKTOK_API_VERSION}/segment/audience/`
export const GET_AUDIENCE_URL = `${BASE_URL}${TIKTOK_API_VERSION}/dmp/custom_audience/get`
export const MIGRATION_FLAG_NAME = 'actions-migrated-tiktok'
