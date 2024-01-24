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

export async function addToList(
  request: RequestClient,
  settings: Settings,
  payloads: AddToListPayload[],
  statsContext?: StatsContext
) {
  // Keep only the scheme and host from the endpoint
  // Marketo shows endpoint with trailing "/rest", which we don't want
  const api_endpoint = settings.api_endpoint.replace('/rest', '')

  const csvData = 'Email\n' + extractEmails(payloads, '\n')
  const csvSize = Buffer.byteLength(csvData, 'utf8')
  if (csvSize > CSV_LIMIT) {
    statsContext?.statsClient?.incr('addToAudience.error', 1, statsContext?.tags)
    throw new IntegrationError(`CSV data size exceeds limit of ${CSV_LIMIT} bytes`, 'INVALID_REQUEST_DATA', 400)
  }

  const url = api_endpoint + BULK_IMPORT_ENDPOINT.replace('externalId', payloads[0].external_id)

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
  // Keep only the scheme and host from the endpoint
  // Marketo shows endpoint with trailing "/rest", which we don't want
  const api_endpoint = settings.api_endpoint.replace('/rest', '')
  const emailsToRemove = extractEmails(payloads, ',')

  const getLeadsUrl = api_endpoint + GET_LEADS_ENDPOINT.replace('emailsToFilter', encodeURIComponent(emailsToRemove))

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

function extractEmails(payloads: AddToListPayload[], separator: string) {
  const emails = payloads
    .filter((payload) => payload.email !== undefined)
    .map((payload) => payload.email)
    .join(separator)
  return emails
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
