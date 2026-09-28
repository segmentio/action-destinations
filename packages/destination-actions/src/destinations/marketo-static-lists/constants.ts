const API_VERSION = 'v1'
export const OAUTH_ENDPOINT = 'identity/oauth/token'
export const GET_FOLDER_ENDPOINT = `/rest/asset/${API_VERSION}/folder/byName.json?name=folderName`
export const CREATE_LIST_ENDPOINT = `/rest/asset/${API_VERSION}/staticLists.json?folder=folderId&name=listName`
export const GET_LIST_ENDPOINT = `/rest/asset/${API_VERSION}/staticList/listId.json`
export const BULK_IMPORT_ENDPOINT = `/bulk/${API_VERSION}/leads.json?format=csv&listId=externalId&lookupField=fieldToLookup`
export const GET_LEADS_ENDPOINT = `/rest/${API_VERSION}/leads.json?filterType=field&filterValues=emailsToFilter`
export const REMOVE_USERS_ENDPOINT = `/rest/${API_VERSION}/lists/listId/leads.json?id=idsToDelete`

export const CSV_LIMIT = 10000000 // 10MB

// Marketo's bulk lead import accepts up to 300k rows, but removing leads from a list is
// capped at 300: both the Get Leads filterValues lookup and the Remove Leads id list.
//
// STAGING TEST ONLY - deliberately tiny so a few hundred test events are enough to fill a
// batch and prove the upstream service resolves batch_size per batch group.
// Real values live on the stratconn-7025-marketo-static-lists branch. Revert before merge.
export const ADD_BATCH_SIZE = 60
export const REMOVE_BATCH_SIZE = 30

export interface RefreshTokenResponse {
  access_token: string
}

export interface MarketoResponse {
  requestId: string
  success: boolean
  errors: {
    code: string
    message: string
  }[]
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

export interface CreateListInput {
  audienceName: string
  settings: {
    client_id: string
    client_secret: string
    api_endpoint: string
    folder_name: string
  }
}
