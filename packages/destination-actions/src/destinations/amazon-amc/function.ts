import { InvalidAuthenticationError } from '@segment/actions-core'
import { JSONLikeObject, MultiStatusResponse, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { AudienceSettings, Settings } from './generated-types'
import type { Payload } from './syncAudiencesToDSP/generated-types'
import { AudienceRecord, HashedPIIObject } from './types'
import { CONSTANTS, RecordsResponseType, REGEX_EXTERNALUSERID } from './utils'
import { processHashing } from '../../lib/hashing-utils'

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
    },
    timeout: 15000
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

  const payloadString = JSON.stringify({ audienceId: payloads[0].audienceId, records: filteredPayloads }).replace(
    /"audienceId":"(\d+)"/,
    '"audienceId":$1'
  )

  const response = await request<RecordsResponseType>(`${settings.region}/amc/audiences/records`, {
    method: 'POST',
    body: payloadString,
    throwHttpErrors: false,
    headers: {
      'Content-Type': 'application/vnd.amcaudiences.v1+json'
    },
    timeout: 15000
  })
  if (!response.ok && response.status == 401) {
    throw new InvalidAuthenticationError(response.statusText)
  }

  return updateMultiStatusResponses(filteredPayloads, validPayloadIndicesBitmap, multiStatusResponse, response)
}

/**
 * Updates the multi-status response with success data for each payload.
 * @param {JSONLikeObject[]} filteredPayloads The list of filtered payloads to process.
 * @param {number[]} validPayloadIndicesBitmap A bitmap of valid payload indices.
 * @param {MultiStatusResponse} multiStatusResponse The multi-status response object to update.
 * @param {any} response The response from the import job request containing the data.
 */
export function updateMultiStatusResponses(
  filteredPayloads: AudienceRecord[],
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse,
  response: any
) {
  filteredPayloads.forEach((payload, index) => {
    const indexBitmap = validPayloadIndicesBitmap[index]
    if (response.ok) {
      multiStatusResponse.setSuccessResponseAtIndex(indexBitmap, {
        status: response.status || 200,
        sent: payload as object as JSONLikeObject,
        body: response?.data || 'success'
      })
    } else {
      multiStatusResponse.setErrorResponseAtIndex(indexBitmap, {
        status: response?.status || 400,
        errormessage: response?.statusText,
        sent: payload as object as JSONLikeObject,
        body: response?.data
      })
    }
  })
  return multiStatusResponse
}

// For data format guidelines, visit: https://advertising.amazon.com/help/GCCXMZYCK4RXWS6C

// General normalization utility function
function normalize(value: string, allowedChars: RegExp, trim = true): string {
  let normalized = value.toLowerCase().replace(allowedChars, '')
  if (trim) normalized = normalized.trim()
  return normalized
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
    hashedPII.firstname = processHashing(payload.firstName, 'sha256', 'hex', normalizeStandard)
  }
  if (payload.lastName) {
    hashedPII.lastname = processHashing(payload.lastName, 'sha256', 'hex', normalizeStandard)
  }
  if (payload.address) {
    hashedPII.address = processHashing(payload.address, 'sha256', 'hex', normalizeStandard)
  }
  if (payload.postal) {
    hashedPII.postal = processHashing(payload.postal, 'sha256', 'hex', normalizeStandard)
  }
  if (payload.phone) {
    hashedPII.phone = processHashing(payload.phone, 'sha256', 'hex', normalizePhone)
  }
  if (payload.city) {
    hashedPII.city = processHashing(payload.city, 'sha256', 'hex', normalizeStandard)
  }
  if (payload.state) {
    hashedPII.state = processHashing(payload.state, 'sha256', 'hex', normalizeStandard)
  }
  if (payload.email) {
    hashedPII.email = processHashing(payload.email, 'sha256', 'hex', normalizeEmail)
  }

  return hashedPII
}
