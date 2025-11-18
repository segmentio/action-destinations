import { TIKTOK_AUDIENCES_API_VERSION } from '../versioning-info'

export const BASE_URL = 'https://business-api.tiktok.com/open_api/'

export const CREATE_AUDIENCE_URL = `${BASE_URL}${TIKTOK_AUDIENCES_API_VERSION}/segment/audience/`
export const GET_AUDIENCE_URL = `${BASE_URL}${TIKTOK_AUDIENCES_API_VERSION}/dmp/custom_audience/get`
export const MIGRATION_FLAG_NAME = 'actions-migrated-tiktok'
