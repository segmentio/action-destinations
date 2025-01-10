import {
  MultiStatusResponse,
  ErrorCodes,
  IntegrationError,
  RetryableError,
  RequestClient,
  StatsContext
} from '@segment/actions-core'
import { ActionDestinationErrorResponseType } from '@segment/actions-core/destination-kit/types'
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
import { JSONLikeObject } from '@segment/actions-core/*'

// Keep only the scheme and host from the endpoint
// Marketo UI shows endpoint with trailing "/rest", which we don't want
export function formatEndpoint(endpoint: string) {
  return endpoint.replace('/rest', '')
}

export async function addToList(
  request: RequestClient,
  settings: Settings,
  payload: AddToListPayload,
  statsContext?: StatsContext,
  hookOutputs?: { id: string; name: string }
) {
  // If the list ID is provided in the hook outputs, use it
  const list_id = hookOutputs?.id ?? payload.external_id

  if (!list_id) {
    const errormessage = 'No list ID found in payload'
    throw new IntegrationError(errormessage, ErrorCodes.PAYLOAD_VALIDATION_FAILED, 400)
  }

  const api_endpoint = formatEndpoint(settings.api_endpoint)

  const csvData = formatData([payload])
  const csvSize = Buffer.byteLength(csvData, 'utf8')
  if (csvSize > CSV_LIMIT) {
    const errormessage = `CSV data size exceeds limit of ${CSV_LIMIT} bytes`
    statsContext?.statsClient?.incr('addToAudience.error', 1, statsContext?.tags)
    throw new IntegrationError(errormessage, 'PAYLOAD_TOO_LARGE', 400)
  }

  const url =
    api_endpoint + BULK_IMPORT_ENDPOINT.replace('externalId', list_id).replace('fieldToLookup', payload.lookup_field)

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

export async function addToListBatch(
  request: RequestClient,
  settings: Settings,
  payloads: AddToListPayload[],
  statsContext?: StatsContext,
  hookOutputs?: { id: string; name: string }
) {
  // If the list ID is provided in the hook outputs, use it
  const list_id = hookOutputs?.id ?? payloads[0].external_id

  if (!list_id) {
    return buildMultiStatusErrorResponse(payloads.length, {
      status: 400,
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: 'No list ID found in payload'
    })
  }

  const api_endpoint = formatEndpoint(settings.api_endpoint)

  const csvData = formatData(payloads)
  const csvSize = Buffer.byteLength(csvData, 'utf8')
  if (csvSize > CSV_LIMIT) {
    statsContext?.statsClient?.incr('addToAudience.error', payloads.length, statsContext?.tags)
    return buildMultiStatusErrorResponse(payloads.length, {
      status: 400,
      errortype: ErrorCodes.PAYLOAD_TOO_LARGE,
      errormessage: `CSV data size exceeds limit of ${CSV_LIMIT} bytes`
    })
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
    statsContext?.statsClient?.incr('addToAudience.error', payloads.length, statsContext?.tags)
    return parseErrorResponseBatch(response.data, payloads.length)
  }

  statsContext?.statsClient?.incr('addToAudience.success', payloads.length, statsContext?.tags)

  // Build a MultiStatusResponse and return it
  const multiStatusResponse = new MultiStatusResponse()

  for (let i = 0; i < payloads.length; i++) {
    multiStatusResponse.setSuccessResponseAtIndex(i, {
      status: 200,
      // CSV data could be as large as 10 MB, so we truncate it to upto 50 characters
      sent: `${csvData.substring(0, 50)}...`,
      // response.data is an API Response, we can safely cast it to JSONLikeObject
      body: response.data as unknown as JSONLikeObject
    })
  }

  return multiStatusResponse
}

export async function removeFromList(
  request: RequestClient,
  settings: Settings,
  payload: RemoveFromListPayload,
  statsContext?: StatsContext
) {
  if (!payload.external_id) {
    throw new IntegrationError('No "external_id" found in payload', ErrorCodes.PAYLOAD_VALIDATION_FAILED, 400)
  }

  const api_endpoint = formatEndpoint(settings.api_endpoint)
  const usersToRemove = extractFilterData([payload])

  const getLeadsUrl =
    api_endpoint +
    GET_LEADS_ENDPOINT.replace('field', payload.lookup_field).replace(
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
    api_endpoint + REMOVE_USERS_ENDPOINT.replace('listId', payload.external_id).replace('idsToDelete', leadIds)

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

export async function removeFromListBatch(
  request: RequestClient,
  settings: Settings,
  payloads: RemoveFromListPayload[],
  statsContext?: StatsContext
) {
  if (!payloads[0].external_id) {
    return buildMultiStatusErrorResponse(payloads.length, {
      status: 400,
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: 'No "external_id" found in payload'
    })
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
    statsContext?.statsClient?.incr('removeFromAudience.error', payloads.length, statsContext?.tags)
    return parseErrorResponseBatch(getLeadsResponse.data, payloads.length)
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
    statsContext?.statsClient?.incr('removeFromAudience.error', payloads.length, statsContext?.tags)
    return parseErrorResponse(deleteLeadsResponse.data)
  }
  statsContext?.statsClient?.incr('removeFromAudience.success', payloads.length, statsContext?.tags)

  // Build a MultiStatusResponse and return it
  const multiStatusResponse = new MultiStatusResponse()

  for (let i = 0; i < payloads.length; i++) {
    multiStatusResponse.setSuccessResponseAtIndex(i, {
      status: 200,
      sent: '',
      // response.data is an API Response, we can safely cast it to JSONLikeObject
      body: deleteLeadsResponse.data as unknown as JSONLikeObject
    })
  }

  return multiStatusResponse
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
    throw new IntegrationError(response.errors[0].message, 'INVALID_AUTHENTICATION', 401)
  }

  if (response.errors[0].code === '1019') {
    throw new RetryableError(
      'Error while attempting to upload users to the list in Marketo. This batch will be retried.'
    )
  }

  throw new IntegrationError(response.errors[0].message, 'NOT_ACCEPTABLE', 400)
}

function parseErrorResponseBatch(response: MarketoResponse, payloadSize: number) {
  if (response.errors[0].code === '601' || response.errors[0].code === '602') {
    return buildMultiStatusErrorResponse(payloadSize, {
      status: 401,
      errortype: ErrorCodes.INVALID_AUTHENTICATION,
      errormessage: response.errors[0].message
    })
  }

  if (response.errors[0].code === '1019') {
    return buildMultiStatusErrorResponse(payloadSize, {
      status: 500,
      errortype: ErrorCodes.RETRYABLE_ERROR,
      errormessage: 'Error while attempting to upload users to the list in Marketo. This batch will be retried.'
    })
  }

  return buildMultiStatusErrorResponse(payloadSize, {
    status: 400,
    errortype: ErrorCodes.NOT_ACCEPTABLE,
    errormessage: response.errors[0].message
  })
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

const buildMultiStatusErrorResponse = (payloadSize: number, error: ActionDestinationErrorResponseType) => {
  const multiStatusResponse = new MultiStatusResponse()

  for (let i = 0; i < payloadSize; i++) {
    multiStatusResponse.setErrorResponseAtIndex(i, error)
  }

  return multiStatusResponse
}
