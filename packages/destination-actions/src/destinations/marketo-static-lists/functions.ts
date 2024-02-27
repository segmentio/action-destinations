import { IntegrationError, RetryableError, RequestClient, StatsContext } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as AddToListPayload } from './addToList/generated-types'
import { Payload as RemoveFromListPayload } from './removeFromList/generated-types'
import {
  CSV_LIMIT,
  BULK_IMPORT_ENDPOINT,
  MarketoBulkImportResponse,
  GET_LEADS_ENDPOINT,
  MarketoGetLeadsResponse,
  MarketoLeads,
  MarketoDeleteLeadsResponse,
  REMOVE_USERS_ENDPOINT,
  MarketoResponse
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
  statsContext?: StatsContext
) {
  const api_endpoint = formatEndpoint(settings.api_endpoint)

  const csvData = formatData(payloads)
  const csvSize = Buffer.byteLength(csvData, 'utf8')
  if (csvSize > CSV_LIMIT) {
    statsContext?.statsClient?.incr('addToAudience.error', 1, statsContext?.tags)
    throw new IntegrationError(`CSV data size exceeds limit of ${CSV_LIMIT} bytes`, 'INVALID_REQUEST_DATA', 400)
  }

  const url =
    api_endpoint +
    BULK_IMPORT_ENDPOINT.replace('externalId', payloads[0].external_id).replace(
      'fieldToLookup',
      payloads[0].lookup_field
    )

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
