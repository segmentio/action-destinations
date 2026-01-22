import { RequestClient, ModifiedResponse, PayloadValidationError, MultiStatusResponse } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload } from './syncAudience/generated-types'
// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'
import { IntegrationError } from '@segment/actions-core'

import { sendEventToAWS } from './awsClient'

export interface DROP_ENDPOINT_API_RESPONSE {
  ReferenceId: string
  Url: string
}

export interface Segments {
  CrmDataId: string
  SegmentName: string
  Region: string
  FirstPartyDataId: number
}
export interface GET_CRMS_API_RESPONSE {
  Segments: [
    {
      CrmDataId: string
      SegmentName: string
      Region: string
      FirstPartyDataId: number
    }
  ]
  PagingToken: string
}

export interface CREATE_API_RESPONSE {
  CrmDataId: string
  FirstPartyDataId: number
}

interface ProcessPayloadInput {
  request: RequestClient
  settings: Settings
  payloads: Payload[]
  features?: Record<string, boolean>
}

// Define constants
const API_VERSION = 'v3'
const BASE_URL = `https://api.thetradedesk.com/${API_VERSION}`
const TTD_MIN_RECORD_COUNT = 1500

export const TTD_LEGACY_FLOW_FLAG_NAME = 'actions-the-trade-desk-crm-legacy-flow'
export const TTD_LIST_ACTION_FLOW_FLAG_NAME = 'ttd-list-action-destination'

const sha256HashedRegex = /^[a-f0-9]{64}$/i
const base64HashedRegex = /^[A-Za-z0-9+/]*={1,2}$/i
const validEmailRegex = /^\S+@\S+\.\S+$/i

export async function processPayload(input: ProcessPayloadInput): Promise<MultiStatusResponse> {
  if (!input.payloads[0].external_id) {
    throw new PayloadValidationError(`No external_id found in payload.`)
  }

  const crmID = input.payloads[0].external_id

  const multiStatusResponse = new MultiStatusResponse()

  // Initially mark all payloads as successful
  input.payloads.forEach((payload, index) => {
    multiStatusResponse.setSuccessResponseAtIndex(index, {
      status: 200,
      sent: { ...payload },
      body: 'Successfully Uploaded to S3'
    })
  })

  // Get user emails from the payloads
  const [usersFormatted, rowCount] = extractUsers(input.payloads, multiStatusResponse)

  // Overwrite to Legacy Flow if feature flag is enabled
  if (input.features && input.features[TTD_LEGACY_FLOW_FLAG_NAME]) {
    //------------
    // LEGACY FLOW
    // -----------

    if (input.payloads.length < TTD_MIN_RECORD_COUNT) {
      for (let i = 0; i < input.payloads.length; i++) {
        multiStatusResponse.setErrorResponseAtIndex(i, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: `received payload count below The Trade Desk's ingestion minimum. Expected: >=${TTD_MIN_RECORD_COUNT} actual: ${input.payloads.length}`,
          sent: { ...input.payloads[i] },
          body: `received payload count below The Trade Desk's ingestion minimum. Expected: >=${TTD_MIN_RECORD_COUNT} actual: ${input.payloads.length}`
        })
      }
      return multiStatusResponse
    }

    try {
      // Create a new TTD Drop Endpoint
      const dropEndpoint = await getCRMDataDropEndpoint(input.request, input.settings, input.payloads[0], crmID)

      // Upload CRM Data to Drop Endpoint
      await uploadCRMDataToDropEndpoint(input.request, dropEndpoint, usersFormatted)

      return multiStatusResponse
    } catch (error) {
      for (let i = 0; i < input.payloads.length; i++) {
        if (multiStatusResponse.isSuccessResponseAtIndex(i)) {
          multiStatusResponse.setErrorResponseAtIndex(i, {
            status: 500,
            errortype: 'RETRYABLE_ERROR',
            errormessage: `Failed to upload to The Trade Desk Drop Endpoint: ${(error as Error).message}`
          })
        }
      }
      return multiStatusResponse
    }
  } else {
    //------------
    // AWS FLOW
    // -----------

    try {
      // Send request to AWS to be processed
      await sendEventToAWS({
        TDDAuthToken: input.settings.auth_token,
        AdvertiserId: input.settings.advertiser_id,
        CrmDataId: crmID,
        UsersFormatted: usersFormatted,
        RowCount: rowCount,
        DropOptions: {
          PiiType: input.payloads[0].pii_type,
          MergeMode: 'Replace',
          RetentionEnabled: true
        }
      })
    } catch (error) {
      // Set the default error to Internal Server Error
      let httpStatusCode = 500

      // If this is an AWS error, extract the status code
      if (error?.$metadata?.httpStatusCode) {
        httpStatusCode = error.$metadata.httpStatusCode
      }

      // Mark all remaining success payloads as failed if AWS upload fails
      for (let i = 0; i < input.payloads.length; i++) {
        if (multiStatusResponse.isErrorResponseAtIndex(i)) {
          continue
        }

        multiStatusResponse.setErrorResponseAtIndex(i, {
          status: httpStatusCode,
          errormessage: `Failed to upload payload to Integrations Outbound Controller`
        })
      }
    }
    return multiStatusResponse
  }
}

function extractUsers(payloads: Payload[], multiStatusResponse: MultiStatusResponse): [string, number] {
  let users = ''
  let rowCount = 0

  payloads.forEach((payload: Payload, index: number) => {
    if (!payload.email || !validateEmail(payload.email, payload.pii_type)) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: `Invalid email format`
      })
      return
    }

    if (payload.pii_type == 'Email') {
      users += `${payload.email}\n`
    }

    if (payload.pii_type == 'EmailHashedUnifiedId2') {
      const hashedEmail = hash(payload.email)
      users += `${hashedEmail}\n`
    }

    // In both mutually exclusive cases above, we increment the row count by 1
    rowCount += 1
  })
  return [users, rowCount]
}

function validateEmail(email: string, pii_type: string): boolean {
  const isSha256HashedEmail = sha256HashedRegex.test(email)
  const isBase64Hashed = base64HashedRegex.test(email)
  const isValidEmail = validEmailRegex.test(email)

  if (pii_type == 'Email') {
    return isValidEmail
  }
  return isSha256HashedEmail || isBase64Hashed || isValidEmail
}

// More info about email normalization: https://api.thetradedesk.com/v3/portal/data/doc/DataPiiNormalization#email-normalize
function normalizeEmail(email: string) {
  // Remove all of the leading and trailing whitespace and convert to lowercase
  email = email.trim().toLowerCase()

  if (email.endsWith('@gmail.com')) {
    const findat = email.indexOf('@')
    let username = email.substring(0, findat)
    // Remove everything after plus if it exists in username
    const findplus = username.indexOf('+')
    if (findplus !== -1) {
      username = username.substring(0, findplus)
    }
    // Remove all the periods in the username
    username = username.replace(/\./g, '')
    // Put email back together
    email = username + '@gmail.com'
  }
  return email
}

export const hash = (value: string): string => {
  const isSha256HashedEmail = sha256HashedRegex.test(value)
  const isBase64Hashed = base64HashedRegex.test(value)

  if (isSha256HashedEmail) {
    return Buffer.from(value, 'hex').toString('base64')
  }

  if (isBase64Hashed) {
    return value
  }

  const normalizedEmail = normalizeEmail(value)
  const hash = createHash('sha256')
  hash.update(normalizedEmail)
  return hash.digest('base64')
}

// Generates a Drop Endpoint URL to upload CRM Data (Legacy Flow)
async function getCRMDataDropEndpoint(request: RequestClient, settings: Settings, payload: Payload, crmId: string) {
  const response: ModifiedResponse<DROP_ENDPOINT_API_RESPONSE> = await request(
    `${BASE_URL}/crmdata/segment/${settings.advertiser_id}/${crmId}`,
    {
      method: 'POST',
      json: {
        PiiType: payload.pii_type,
        MergeMode: 'Replace',
        RetentionEnabled: true
      }
    }
  )

  return response.data.Url
}

// Uploads CRM Data to Drop Endpoint (Legacy Flow)
async function uploadCRMDataToDropEndpoint(request: RequestClient, endpoint: string, users: string) {
  await request(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: users
  })
}

export async function getAllDataSegments(request: RequestClient, advertiserId: string, authToken: string) {
  const allDataSegments: Segments[] = []
  // initial call to get first page
  let response: ModifiedResponse<GET_CRMS_API_RESPONSE> = await request(`${BASE_URL}/crmdata/segment/${advertiserId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'TTD-Auth': authToken
    }
  })

  if (response.status != 200 || !response.data.Segments) {
    throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
  }
  let segments = response.data.Segments
  // pagingToken leads you to the next page
  let pagingToken = response.data.PagingToken
  // keep iterating through pages until the last empty page
  while (segments.length > 0) {
    allDataSegments.push(...segments)
    response = await request(`${BASE_URL}/crmdata/segment/${advertiserId}?pagingToken=${pagingToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'TTD-Auth': authToken
      }
    })

    segments = response.data.Segments
    pagingToken = response.data.PagingToken
  }
  return allDataSegments
}
