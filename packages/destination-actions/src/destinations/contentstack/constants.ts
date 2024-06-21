import { StringkeyedObj } from './types'

export const CS_DELIM = '_auth-params_'

export const CS_ACCESSTOKEN_APIS: StringkeyedObj = {
  NA: 'https://developerhub-api.contentstack.com/apps/token',
  EU: 'https://eu-developerhub-api.contentstack.com/apps/token',
  AZURE_NA: 'https://azure-na-developerhub-api.contentstack.com/apps/token',
  AZURE_EU: 'https://azure-eu-developerhub-api.contentstack.com/apps/token'
}

export const PERSONALIZE_APIS: StringkeyedObj = {
  NA: 'https://personalization-api.contentstack.com',
  EU: 'https://eu-personalization-api.contentstack.com',
  AZURE_NA: 'https://azure-na-personalization-api.contentstack.com',
  AZURE_EU: 'https://azure-eu-personalization-api.contentstack.com'
}

export const PERSONALIZE_EDGE_APIS: StringkeyedObj = {
  NA: 'https://personalization-edge.contentstack.com',
  EU: 'https://eu-personalization-edge.contentstack.com',
  AZURE_NA: 'https://azure-na-personalization-edge.contentstack.com',
  AZURE_EU: 'https://azure-eu-personalization-edge.contentstack.com'
}
