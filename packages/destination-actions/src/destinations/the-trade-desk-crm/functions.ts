import { IntegrationError, RequestClient, ModifiedResponse } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload } from './syncAudience/generated-types'
import { createHash } from 'crypto'

import { sendEventToAWS } from './awsClient'

const API_VERSION = 'v3'
const BASE_URL = `https://api.thetradedesk.com/${API_VERSION}`

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

export async function processPayload(request: RequestClient, settings: Settings, payloads: Payload[]) {
  // const TTD_MIN_RECORD_COUNT = 1500
  // if (payloads.length < TTD_MIN_RECORD_COUNT) {
  //   throw new PayloadValidationError(
  //     `received payload count below The Trade Desk's ingestion limits. Expected: >=${TTD_MIN_RECORD_COUNT} actual: ${payloads.length}`
  //   )
  // }
  const crmID = await getCRMInfo(request, settings, payloads[0])

  // Get user emails from the payloads
  const usersFormatted = extractUsers(payloads)

  // Send request to AWS to be processed
  const AWSOperationStatus = await sendEventToAWS({
    TDDAuthToken: settings.auth_token,
    AdvertiserId: settings.advertiser_id,
    CrmDataId: crmID,
    SegmentName: payloads[0].name,
    UsersFormatted: usersFormatted,
    DropOptions: {
      PiiType: payloads[0].pii_type,
      MergeMode: 'Replace'
    }
  })

  return AWSOperationStatus
}

async function getAllDataSegments(request: RequestClient, settings: Settings) {
  const allDataSegments: Segments[] = []
  // initial call to get first page
  let response: ModifiedResponse<GET_CRMS_API_RESPONSE> = await request(
    `${BASE_URL}/crmdata/segment/${settings.advertiser_id}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'TTD-Auth': settings.auth_token
      }
    }
  )
  let segments = response.data.Segments
  // pagingToken leads you to the next page
  let pagingToken = response.data.PagingToken
  // keep iterating through pages until the last empty page
  while (segments.length > 0) {
    allDataSegments.push(...segments)
    response = await request(`${BASE_URL}/crmdata/segment/${settings.advertiser_id}?pagingToken=${pagingToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'TTD-Auth': settings.auth_token
      }
    })

    segments = response.data.Segments
    pagingToken = response.data.PagingToken
  }
  return allDataSegments
}

async function getCRMInfo(request: RequestClient, settings: Settings, payload: Payload): Promise<string> {
  let segmentId: string
  const segments = await getAllDataSegments(request, settings)
  const segmentExists = segments.filter(function (segment) {
    if (segment.SegmentName == payload.name) {
      return segment
    }
  })

  // More than 1 audience returned matches name
  if (segmentExists.length > 1) {
    throw new IntegrationError('Multiple audiences found with the same name', 'INVALID_SETTINGS', 400)
  } else if (segmentExists.length == 1) {
    segmentId = segmentExists[0].CrmDataId
  } else {
    // If an audience does not exist, we will create it. In V1, we will send a single batch
    // of full audience syncs every 24 hours to eliminate the risk of a race condition.
    const response: ModifiedResponse<CREATE_API_RESPONSE> = await request(`${BASE_URL}/crmdata/segment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTD-Auth': settings.auth_token
      },
      json: {
        AdvertiserId: settings.advertiser_id,
        SegmentName: payload.name,
        Region: payload.region
      }
    })
    segmentId = response.data.CrmDataId
  }

  return segmentId
}

function extractUsers(payloads: Payload[]): string {
  let users = ''
  payloads.forEach((payload: Payload) => {
    if (!payload.email) {
      return
    }

    if (payload.pii_type == 'Email') {
      users += `${payload.email}\n`
    }

    if (payload.pii_type == 'EmailHashedUnifiedId2') {
      const normalizedEmail = normalizeEmail(payload.email)
      const hashedEmail = hash(normalizedEmail)
      users += `${hashedEmail}\n`
    }
  })
  return users
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
  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('base64')
}
