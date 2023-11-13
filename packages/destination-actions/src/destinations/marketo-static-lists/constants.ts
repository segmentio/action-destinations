import { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'

const API_VERSION = 'v1'
const OAUTH_ENDPOINT = 'identity/oauth/token'
export const GET_FOLDER_ENDPOINT = `/rest/asset/${API_VERSION}/folder/byName.json?name=folderName`
export const CREATE_LIST_ENDPOINT = `/rest/asset/${API_VERSION}/staticLists.json?folder=folderId&name=listName`
export const GET_LIST_ENDPOINT = `/rest/asset/${API_VERSION}/staticList/listId.json`
export const BULK_IMPORT_ENDPOINT = `/bulk/${API_VERSION}/leads.json?format=csv&listId=externalId`
export const GET_LEADS_ENDPOINT = `/rest/${API_VERSION}/leads.json?filterType=email&filterValues=emailsToFilter`
export const REMOVE_USERS_ENDPOINT = `/rest/${API_VERSION}/lists/listId/leads.json?id=idsToDelete`

export const CSV_LIMIT = 10000000 // 10MB
export interface RefreshTokenResponse {
  access_token: string
}

export interface MarketoResponse {
  requestId: string
  success: boolean
  errors: [
    {
      code: string
      message: string
    }
  ]
}

export interface MarketoListResponse extends MarketoResponse {
  result: [
    {
      name: string
      id: number
    }
  ]
}

export interface MarketoBulkImportResponse extends MarketoResponse {
  result: [
    {
      batchId: number
      importId: string
      status: string
    }
  ]
}

export interface MarketoGetLeadsResponse extends MarketoResponse {
  result: [MarketoLeads]
}

export interface MarketoDeleteLeadsResponse extends MarketoResponse {
  result: [
    {
      id: number
      status: string
    }
  ]
}

export interface MarketoLeads {
  id: number
  firstName: string
  lastName: string
  email: string
  updatedAt: string
  createdAt: string
}

export async function getAccessToken(request: RequestClient, settings: Settings) {
  const res = await request<RefreshTokenResponse>(`${settings.api_endpoint}/${OAUTH_ENDPOINT}`, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'client_credentials'
    })
  })

  return res.data.access_token
}
