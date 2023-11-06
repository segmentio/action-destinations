import { IntegrationError, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as AddToListPayload } from './addToList/generated-types'
import { Payload as RemoveFromListPayload } from './removeFromList/generated-types'
import { CSV_LIMIT, BULK_IMPORT_ENDPOINT, MarketoBulkImportResponse } from './constants'

export async function addToList(request: RequestClient, settings: Settings, payloads: AddToListPayload[]) {
  const csvData = getCSV(payloads)
  const csvSize = Buffer.byteLength(csvData, 'utf8')
  if (csvSize > CSV_LIMIT) {
    throw new IntegrationError(`CSV data size exceeds limit of ${CSV_LIMIT} bytes`, 'INVALID_REQUEST_DATA', 400)
  }

  const url = settings.api_endpoint + BULK_IMPORT_ENDPOINT.replace('externalId', payloads[0].external_id)

  const response = await request<MarketoBulkImportResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=--SEGMENT-DATA--'
    },
    body: createFormData(csvData)
  })

  if (!response.data.success) {
    throw new IntegrationError(response.data.errors[0].message, 'INVALID_RESPONSE', 400)
  }
  return response.data
}

export async function removeFromList(request: RequestClient, settings: Settings, payloads: RemoveFromListPayload[]) {
  const csvData = getCSV(payloads)
  const csvSize = Buffer.byteLength(csvData, 'utf8')
  if (csvSize > CSV_LIMIT) {
    throw new IntegrationError(`CSV data size exceeds limit of ${CSV_LIMIT} bytes`, 'INVALID_REQUEST_DATA', 400)
  }

  const url = settings.api_endpoint + BULK_IMPORT_ENDPOINT.replace('externalId', payloads[0].external_id)

  const response = await request<MarketoBulkImportResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=--SEGMENT-DATA--'
    },
    body: createFormData(csvData)
  })

  if (!response.data.success) {
    throw new IntegrationError(response.data.errors[0].message, 'INVALID_RESPONSE', 400)
  }
  return response.data
}

function getCSV(payloads: AddToListPayload[]) {
  const header = 'Email\n'
  const csvData = payloads.map((payload) => `${payload.email}\n`).join('')
  return header + csvData
}

function createFormData(csvData: string) {
  const boundary = '--SEGMENT-DATA--'
  const formData = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="leads.csv"\r\nContent-Type: text/csv\r\n\r\n${csvData}\r\n--${boundary}--\r\n`
  return formData
}
