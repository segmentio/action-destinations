import { IntegrationError, RetryableError, RequestClient, StatsContext } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as AddToListPayload } from './addToList/generated-types'
import { Payload as RemoveFromListPayload } from './removeFromList/generated-types'
import {
  CSV_LIMIT,
  BULK_IMPORT_ENDPOINT,
  MarketoBulkImportResponse,
  GET_LEADS_ENDPOINT,
  GET_FOLDER_ENDPOINT,
  MarketoGetLeadsResponse,
  MarketoLeads,
  MarketoDeleteLeadsResponse,
  REMOVE_USERS_ENDPOINT,
  MarketoResponse,
  CreateListInput,
  OAUTH_ENDPOINT,
  RefreshTokenResponse,
  MarketoListResponse,
  CREATE_LIST_ENDPOINT,
  GET_LIST_ENDPOINT
} from './constants'

// Keep only the scheme and host from the endpoint
// Marketo UI shows endpoint with trailing "/rest", which we don't want
export function formatEndpoint(endpoint: string) {
  return endpoint.replace('/rest', '')
}

export async function addToList(
  request: RequestClient,
  settings: Settings,
  payloads: AddToListPayload[],
  statsContext?: StatsContext,
  hookOutputs?: { id: string; name: string }
) {
  // If the list ID is provided in the hook outputs, use it
  const list_id = hookOutputs?.id ?? payloads[0].external_id

  if (!list_id) {
    throw new IntegrationError('No list ID found in payload', 'INVALID_REQUEST_DATA', 400)
  }

  const api_endpoint = formatEndpoint(settings.api_endpoint)

  const csvData = formatData(payloads)
  const csvSize = Buffer.byteLength(csvData, 'utf8')
  if (csvSize > CSV_LIMIT) {
    statsContext?.statsClient?.incr('addToAudience.error', 1, statsContext?.tags)
    throw new IntegrationError(`CSV data size exceeds limit of ${CSV_LIMIT} bytes`, 'INVALID_REQUEST_DATA', 400)
  }

  const url =
    api_endpoint +
    BULK_IMPORT_ENDPOINT.replace('externalId', list_id).replace('fieldToLookup', payloads[0].lookup_field)

  const response = await request<MarketoBulkImportResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=--SEGMENT-DATA--'
    },
    body: createFormData(csvData)
  })

  if (!response.data.success) {
    statsContext?.statsClient?.incr('addToAudience.error', 1, statsContext?.tags)
    parseErrorResponse(response.data)
  }
  statsContext?.statsClient?.incr('addToAudience.success', 1, statsContext?.tags)
  return response.data
}

export async function removeFromList(
  request: RequestClient,
  settings: Settings,
  payloads: RemoveFromListPayload[],
  statsContext?: StatsContext
) {
  if (!payloads[0].external_id) {
    throw new IntegrationError('No external_id found in payload', 'INVALID_REQUEST_DATA', 400)
  }

  const api_endpoint = formatEndpoint(settings.api_endpoint)
  const usersToRemove = extractFilterData(payloads)

  const getLeadsUrl =
    api_endpoint +
    GET_LEADS_ENDPOINT.replace('field', payloads[0].lookup_field).replace(
      'emailsToFilter',
      encodeURIComponent(usersToRemove)
    )

  // Get lead ids from Marketo
  const getLeadsResponse = await request<MarketoGetLeadsResponse>(getLeadsUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!getLeadsResponse.data.success) {
    statsContext?.statsClient?.incr('removeFromAudience.error', 1, statsContext?.tags)
    parseErrorResponse(getLeadsResponse.data)
  }

  const leadIds = extractLeadIds(getLeadsResponse.data.result)

  const deleteLeadsUrl =
    api_endpoint + REMOVE_USERS_ENDPOINT.replace('listId', payloads[0].external_id).replace('idsToDelete', leadIds)

  // DELETE lead ids from list in Marketo
  const deleteLeadsResponse = await request<MarketoDeleteLeadsResponse>(deleteLeadsUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!deleteLeadsResponse.data.success) {
    statsContext?.statsClient?.incr('removeFromAudience.error', 1, statsContext?.tags)
    parseErrorResponse(deleteLeadsResponse.data)
  }
  statsContext?.statsClient?.incr('removeFromAudience.success', 1, statsContext?.tags)
  return deleteLeadsResponse.data
}

function createFormData(csvData: string) {
  const boundary = '--SEGMENT-DATA--'
  const formData = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="leads.csv"\r\nContent-Type: text/csv\r\n\r\n${csvData}\r\n--${boundary}--\r\n`
  return formData
}

function formatData(payloads: AddToListPayload[]) {
  if (payloads.length === 0) {
    return ''
  }

  const allKeys = [...new Set(payloads.flatMap((payload) => Object.keys(payload.data)))]
  const header = allKeys.join(',')
  const csvData = payloads
    .map((payload) => allKeys.map((key) => payload.data[key as keyof typeof payload.data] || '').join(','))
    .join('\n')

  return `${header}\n${csvData}`
}

function extractFilterData(payloads: RemoveFromListPayload[]) {
  const data = payloads
    .filter((payload) => payload.field_value !== undefined)
    .map((payload) => payload.field_value)
    .join(',')
  return data
}

function extractLeadIds(leads: MarketoLeads[]) {
  const ids = leads.map((lead) => `${lead.id}`).join(',')
  return ids
}

function parseErrorResponse(response: MarketoResponse) {
  if (response.errors[0].code === '601' || response.errors[0].code === '602') {
    throw new IntegrationError(response.errors[0].message, 'INVALID_OAUTH_TOKEN', 401)
  }
  if (response.errors[0].code === '1019') {
    throw new RetryableError(
      'Error while attempting to upload users to the list in Marketo. This batch will be retried.'
    )
  }
  throw new IntegrationError(response.errors[0].message, 'INVALID_RESPONSE', 400)
}

export async function getAccessToken(request: RequestClient, settings: Settings) {
  const api_endpoint = formatEndpoint(settings.api_endpoint)
  const res = await request<RefreshTokenResponse>(`${api_endpoint}/${OAUTH_ENDPOINT}`, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'client_credentials'
    })
  })

  return res.data.access_token
}

export async function getList(request: RequestClient, settings: Settings, id: string) {
  const accessToken = await getAccessToken(request, settings)
  const endpoint = formatEndpoint(settings.api_endpoint)

  const getListUrl = endpoint + GET_LIST_ENDPOINT.replace('listId', id)

  const getListResponse = await request<MarketoListResponse>(getListUrl, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })

  if (!getListResponse.data.success && getListResponse.data.errors) {
    throw new IntegrationError(`${getListResponse.data.errors[0].message}`, 'INVALID_RESPONSE', 400)
  }

  if (!getListResponse.data.result) {
    throw new IntegrationError(`List with ID ${id} not found`, 'INVALID_REQUEST_DATA', 400)
  }

  return {
    successMessage: `Using existing list '${getListResponse.data.result[0].name}' (id: ${id})`,
    savedData: {
      id: id,
      name: getListResponse.data.result[0].name
    }
  }
}

export async function createList(request: RequestClient, input: CreateListInput, statsContext?: StatsContext) {
  const statsClient = statsContext?.statsClient
  const statsTags = statsContext?.tags

  if (!input.audienceName) {
    throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
  }

  // Format Marketo base endpoint
  const endpoint = formatEndpoint(input.settings.api_endpoint)

  // Get access token
  const accessToken = await getAccessToken(request, input.settings)

  const getFolderUrl =
    endpoint + GET_FOLDER_ENDPOINT.replace('folderName', encodeURIComponent(input.settings.folder_name))

  // Get folder ID by name
  const getFolderResponse = await request<MarketoListResponse>(getFolderUrl, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })

  // Since the API will return 200 we need to parse the response to see if it failed.
  if (!getFolderResponse.data.success && getFolderResponse.data.errors) {
    statsClient?.incr('createAudience.error', 1, statsTags)
    throw new IntegrationError(`${getFolderResponse.data.errors[0].message}`, 'INVALID_RESPONSE', 400)
  }

  if (!getFolderResponse.data.result) {
    statsClient?.incr('createAudience.error', 1, statsTags)
    throw new IntegrationError(
      `A folder with the name ${input.settings.folder_name} not found`,
      'INVALID_REQUEST_DATA',
      400
    )
  }

  const folderId = getFolderResponse.data.result[0].id.toString()

  const createListUrl =
    endpoint +
    CREATE_LIST_ENDPOINT.replace('folderId', folderId).replace('listName', encodeURIComponent(input.audienceName))

  // Create list in given folder
  const createListResponse = await request<MarketoListResponse>(createListUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })

  if (!createListResponse.data.success && createListResponse.data.errors) {
    statsClient?.incr('createAudience.error', 1, statsTags)
    throw new IntegrationError(`${createListResponse.data.errors[0].message}`, 'INVALID_RESPONSE', 400)
  }

  const listId = createListResponse.data.result[0].id.toString()
  statsClient?.incr('createAudience.success', 1, statsTags)

  return listId
}
