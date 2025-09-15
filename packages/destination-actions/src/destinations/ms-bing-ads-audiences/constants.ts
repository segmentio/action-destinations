import { DependsOnConditions } from '@segment/actions-core/destination-kittypes'

const API_VERSION = 'v13'
export const BASE_URL = `https://campaign.api.bingads.microsoft.com/CampaignManagement/${API_VERSION}`
export const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
export const EMAIL_CONDITION: DependsOnConditions = {
  conditions: [{ fieldKey: 'identifier_type', operator: 'is', value: 'Email' }]
}
export const CRM_CONDITION: DependsOnConditions = {
  conditions: [{ fieldKey: 'identifier_type', operator: 'is', value: 'CRM' }]
}
