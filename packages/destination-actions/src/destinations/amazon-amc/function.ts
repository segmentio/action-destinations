import {
  HTTPError,
  JSONLikeObject,
  MultiStatusResponse,
  PayloadValidationError,
  RequestClient
} from '@segment/actions-core'
import { createHash } from 'crypto'
import { AudienceSettings, Settings } from './generated-types'
import type { Payload } from './syncAudiencesToDSP/generated-types'
import { AudienceRecord, HashedPIIObject } from './types'
import { CONSTANTS, RecordsResponseType, REGEX_EXTERNALUSERID } from './utils'

export async function processPayload(
  request: RequestClient,
  settings: Settings,
  payload: Payload[],
  audienceSettings: AudienceSettings
) {
  const payloadRecord = createPayloadToUploadRecords(payload, audienceSettings)
  // Regular expression to find a audienceId numeric string and replace the quoted audienceId string with an unquoted number
  const payloadString = JSON.stringify(payloadRecord).replace(/"audienceId":"(\d+)"/, '"audienceId":$1')

  const response = await request<RecordsResponseType>(`${settings.region}/amc/audiences/records`, {
    method: 'POST',
    body: payloadString,
    headers: {
      'Content-Type': 'application/vnd.amcaudiences.v1+json'
    }
  })

  const result = response.data
  return {
    result
  }
}

/**
 * Creates a payload to upload records to the audience service.
 *
 * This function constructs the payload by validating externalUserId and normalizing
 * the personal identifiable information (PII) of each record.
 *
 * @param {Payload[]} payloads - The list of payloads to be processed.
 * @param {AudienceSettings} audienceSettings - Audience-specific settings, such as country code.
 *
 * @returns {Object} - The constructed payload object containing the records and audienceId.
 *
 * @throws {PayloadValidationError} - Throws an error if any externalUserId does not
 *    match the expected pattern.
 */
export function createPayloadToUploadRecords(payloads: Payload[], audienceSettings: AudienceSettings) {
  const records: AudienceRecord[] = []
  const { audienceId } = payloads[0]
  payloads.forEach((payload: Payload) => {
    // Check if the externalUserId matches the pattern
    if (!REGEX_EXTERNALUSERID.test(payload.externalUserId)) {
      return // Skip to the next iteration
    }
    const hashedPII = hashedPayload(payload)
    const payloadRecord: AudienceRecord = {
      externalUserId: payload.externalUserId,
      countryCode: audienceSettings.countryCode,
      action: payload.event_name == 'Audience Entered' ? CONSTANTS.CREATE : CONSTANTS.DELETE,
      hashedPII: [hashedPII]
    }
    records.push(payloadRecord)
  })
  // When all invalid payloads are being filtered out or discarded because they do not match the externalUserId regular expression pattern.
  if (!records?.length) {
    throw new PayloadValidationError(
      'externalUserId must satisfy regular expression pattern: [0-9a-zA-Z\\-\\_]{1,128}}'
    )
  }

  return {
    records: records,
    audienceId: audienceId
  }
}

function validateAndPreparePayload(
  payloads: Payload[],
  multiStatusResponse: MultiStatusResponse,
  audienceSettings: AudienceSettings
) {
  const validPayloadIndicesBitmap: number[] = []
  const filteredPayloads: AudienceRecord[] = []
  payloads.forEach((payload: Payload, originalBatchIndex) => {
    // Check if the externalUserId matches the pattern
    if (!REGEX_EXTERNALUSERID.test(payload.externalUserId)) {
      multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'externalUserId must satisfy regular expression pattern: [0-9a-zA-Z\\-\\_]{1,128}}'
      })
      return
    }

    const hashedPII = hashedPayload(payload)
    const payloadRecord: AudienceRecord = {
      externalUserId: payload.externalUserId,
      countryCode: audienceSettings.countryCode,
      action: payload.event_name == 'Audience Entered' ? CONSTANTS.CREATE : CONSTANTS.DELETE,
      hashedPII: [hashedPII]
    }
    filteredPayloads.push(payloadRecord)
    validPayloadIndicesBitmap.push(originalBatchIndex)
  })

  return { filteredPayloads, validPayloadIndicesBitmap }
}
/**
 * Sends a batch of payloads to the audience service for processing.
 *
 * This function batches the payloads into a request and sends it to the audience service.
 * It also handles success and error responses for each payload in the batch.
 *
 * @param {RequestClient} request - The client used to send HTTP requests.
 * @param {Settings} settings - Configuration settings, including region.
 * @param {Payload[]} payloads - The payloads to be sent.
 * @param {AudienceSettings} audienceSettings - Audience-specific settings.
 *
 * @returns {Promise<MultiStatusResponse>} - The multi-status response with the outcome
 *    for each payload.
 */
export async function processBatchPayload(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  audienceSettings: AudienceSettings
) {
  const multiStatusResponse = new MultiStatusResponse()
  const { filteredPayloads, validPayloadIndicesBitmap } = validateAndPreparePayload(
    payloads,
    multiStatusResponse,
    audienceSettings
  )

  if (!filteredPayloads.length) {
    return multiStatusResponse
  }

  try {
    const payloadString = JSON.stringify({ audienceId: payloads[0].audienceId, records: filteredPayloads }).replace(
      /"audienceId":"(\d+)"/,
      '"audienceId":$1'
    )

    const response = await request<RecordsResponseType>(`${settings.region}/amc/audiences/records`, {
      method: 'POST',
      body: payloadString,
      headers: {
        'Content-Type': 'application/vnd.amcaudiences.v1+json'
      }
    })
    updateMultiStatusWithSuccessData(filteredPayloads, validPayloadIndicesBitmap, multiStatusResponse, response)
  } catch (error) {
    if (error instanceof HTTPError) {
      await updateMultiStatusWithAmazonErrors(
        payloads as object as JSONLikeObject[],
        error,
        multiStatusResponse,
        validPayloadIndicesBitmap
      )
    } else {
      throw error // Bubble up the error
    }
  }
  return multiStatusResponse
}

/**
 * Updates the multi-status response with success data for each payload.
 * @param {JSONLikeObject[]} filteredPayloads The list of filtered payloads to process.
 * @param {number[]} validPayloadIndicesBitmap A bitmap of valid payload indices.
 * @param {MultiStatusResponse} multiStatusResponse The multi-status response object to update.
 * @param {any} response The response from the import job request containing the data.
 */
export function updateMultiStatusWithSuccessData(
  filteredPayloads: AudienceRecord[],
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse,
  response: any
) {
  filteredPayloads.forEach((payload, index) => {
    multiStatusResponse.setSuccessResponseAtIndex(validPayloadIndicesBitmap[index], {
      status: 200,
      sent: payload as object as JSONLikeObject,
      body: response?.data || 'success'
    })
  })
}

/**
 * Updates the multi-status response with error information from Amazon for a batch of payloads.
 *
 * This function is designed to handle errors returned by Amazon.
 *
 * @param {JSONLikeObject[]} payloads - An array of payloads that were sent in the bulk operation.
 * @param {any} err - The error object received from the Amazon API response.
 * @param {MultiStatusResponse} multiStatusResponse - The object responsible for storing the status of each payload.
 * @param {number[]} validPayloadIndicesBitmap - An array of indices indicating which payloads were valid.
 *
 */
async function updateMultiStatusWithAmazonErrors(
  payloads: JSONLikeObject[],
  err: any,
  multiStatusResponse: MultiStatusResponse,
  validPayloadIndicesBitmap: number[]
) {
  const errorResponse = await err?.response?.json()
  payloads.forEach((payload, index) => {
    multiStatusResponse.setErrorResponseAtIndex(validPayloadIndicesBitmap[index], {
      status: err?.response?.status || 400,
      // errortype will be inferred from status
      errormessage: err?.response?.statusText,
      sent: payload,
      body: errorResponse
    })
  })
}

// For data format guidelines, visit: https://advertising.amazon.com/help/GCCXMZYCK4RXWS6C

// General normalization utility function
function normalize(value: string, allowedChars: RegExp, trim = true): string {
  let normalized = value.toLowerCase().replace(allowedChars, '')
  if (trim) normalized = normalized.trim()
  const hash = createHash('sha256')
  hash.update(normalized)
  return hash.digest('hex')
}

// Define allowed character patterns
const alphanumeric = /[^a-z0-9]/g
const emailAllowed = /[^a-z0-9.@-]/g
const nonDigits = /[^\d]/g

// Combine city,state,firstName,lastName normalization
function normalizeStandard(value: string): string {
  return normalize(value, alphanumeric)
}

function normalizePhone(phone: string): string {
  return normalize(phone, nonDigits)
}

function normalizeEmail(email: string): string {
  return normalize(email, emailAllowed)
}

/**
 * Normalizes and hashes the personal identifiable information (PII) in a payload.
 *
 * This function hashes various PII fields such as name, address, email, etc., in
 * the provided payload.
 *
 * @param {Payload} payload - The payload containing personal identifiable information.
 *
 * @returns {HashedPIIObject} - The object containing the hashed PII fields.
 */

function hashedPayload(payload: Payload): HashedPIIObject {
  const hashedPII: HashedPIIObject = {}

  if (payload.firstName) {
    hashedPII.firstname = normalizeStandard(payload.firstName)
  }
  if (payload.lastName) {
    hashedPII.lastname = normalizeStandard(payload.lastName)
  }
  if (payload.address) {
    hashedPII.address = normalizeStandard(payload.address)
  }
  if (payload.postal) {
    hashedPII.postal = normalizeStandard(payload.postal)
  }
  if (payload.phone) {
    hashedPII.phone = normalizePhone(payload.phone)
  }
  if (payload.city) {
    hashedPII.city = normalizeStandard(payload.city)
  }
  if (payload.state) {
    hashedPII.state = normalizeStandard(payload.state)
  }
  if (payload.email) {
    hashedPII.email = normalizeEmail(payload.email)
  }

  return hashedPII
}
