import { DependsOnConditions } from '@segment/actions-core/destination-kit/types'
import { MS_BING_ADS_AUDIENCES_API_VERSION } from '../versioning-info'

const API_VERSION = MS_BING_ADS_AUDIENCES_API_VERSION
export const BASE_URL = `https://campaign.api.bingads.microsoft.com/CampaignManagement/${API_VERSION}`
export const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
export const EMAIL_CONDITION: DependsOnConditions = {
  conditions: [{ fieldKey: 'identifier_type', operator: 'is', value: 'Email' }]
}
export const CRM_CONDITION: DependsOnConditions = {
  conditions: [{ fieldKey: 'identifier_type', operator: 'is', value: 'CRM' }]
}
