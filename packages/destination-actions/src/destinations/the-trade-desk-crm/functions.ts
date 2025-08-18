import { RequestClient, ModifiedResponse, PayloadValidationError } from '@segment/actions-core'
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

export async function processPayload(input: ProcessPayloadInput) {
  let crmID
  if (!input.payloads[0].external_id) {
    throw new PayloadValidationError(`No external_id found in payload.`)
  } else {
    crmID = input.payloads[0].external_id
  }

  // Get user emails from the payloads
  const usersFormatted = extractUsers(input.payloads)

  // Overwrite to Legacy Flow if feature flag is enabled
  if (input.features && input.features[TTD_LEGACY_FLOW_FLAG_NAME]) {
    //------------
    // LEGACY FLOW
    // -----------

    if (input.payloads.length < TTD_MIN_RECORD_COUNT) {
      throw new PayloadValidationError(
        `received payload count below The Trade Desk's ingestion minimum. Expected: >=${TTD_MIN_RECORD_COUNT} actual: ${input.payloads.length}`
      )
    }

    // Create a new TTD Drop Endpoint
    const dropEndpoint = await getCRMDataDropEndpoint(input.request, input.settings, input.payloads[0], crmID)

    // Upload CRM Data to Drop Endpoint
    return uploadCRMDataToDropEndpoint(input.request, dropEndpoint, usersFormatted)
  } else {
    //------------
    // AWS FLOW
    // -----------

    // Send request to AWS to be processed
    return sendEventToAWS(input.request, {
      TDDAuthToken: input.settings.auth_token,
      AdvertiserId: input.settings.advertiser_id,
      CrmDataId: crmID,
      UsersFormatted: usersFormatted,
      DropOptions: {
        PiiType: input.payloads[0].pii_type,
        MergeMode: 'Replace',
        RetentionEnabled: true
      }
    })
  }
}

function extractUsers(payloads: Payload[]): string {
  let users = ''
  payloads.forEach((payload: Payload) => {
    if (!payload.email || !validateEmail(payload.email, payload.pii_type)) {
      return
    }

    if (payload.pii_type == 'Email') {
      users += `${payload.email}\n`
    }

    if (payload.pii_type == 'EmailHashedUnifiedId2') {
      const hashedEmail = hash(payload.email)
      users += `${hashedEmail}\n`
    }
  })
  return users
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
  return await request(endpoint, {
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
