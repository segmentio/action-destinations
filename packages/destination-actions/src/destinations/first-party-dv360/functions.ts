import { ErrorCodes, Features, IntegrationError, ModifiedResponse, RequestClient, StatsContext } from '@segment/actions-core'
import { Payload } from './addToAudContactInfo/generated-types'
import { Payload as DeviceIdPayload } from './addToAudMobileDeviceId/generated-types'
import { processHashing } from '../../lib/hashing-utils'
import { DV360Audience } from './syncAudience/types'
import { FIRST_PARTY_DV360_API_VERSION, FIRST_PARTY_DV360_CANARY_API_VERSION } from './versioning-info'

export const API_VERSION = FIRST_PARTY_DV360_API_VERSION
export const CANARY_API_VERSION = FIRST_PARTY_DV360_CANARY_API_VERSION
export const FLAGON_NAME = 'first-party-dv360-canary-version'

const DV360API = `https://displayvideo.googleapis.com/`
const CONSENT_STATUS_GRANTED = 'CONSENT_STATUS_GRANTED' // Define consent status

export function getApiVersion(features?: Features, statsContext?: StatsContext): string {
  const statsClient = statsContext?.statsClient
  const tags = statsContext?.tags
  const version = features && features[FLAGON_NAME] ? CANARY_API_VERSION : API_VERSION
  statsClient?.incr('dv360_api_version', 1, [...(tags || []), `version:${version}`])
  return version
}

function getAudienceEndpoint(version: string, advertiserId: string, audienceId?: string): string {
  if (audienceId) {
    return DV360API + `${version}/firstPartyAndPartnerAudiences/` + `${audienceId}?advertiserId=${advertiserId}`
  } else {
    return DV360API + `${version}/firstPartyAndPartnerAudiences` + `?advertiserId=${advertiserId}`
  }
}

export function getEditCustomerMatchMembersEndpoint(version: string, audienceId: string): string {
  return DV360API + `${version}/firstPartyAndPartnerAudiences/` + audienceId + ':editCustomerMatchMembers'
}

interface createAudienceRequestParams {
  advertiserId: string
  audienceName: string
  description?: string
  membershipDurationDays: string
  audienceType: string
  appId?: string
  token?: string
  features?: Features
  statsContext?: StatsContext
}

interface getAudienceParams {
  advertiserId: string
  audienceId: string
  token?: string
  features?: Features
  statsContext?: StatsContext
}

interface DV360editCustomerMatchResponse {
  firstPartyAndPartnerAudienceId?: string
  error: [
    {
      code: string
      message: string
      status: string
    }
  ]
}

interface DV360ErrorResponse {
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

type DV360AudienceResponse = DV360Audience & DV360ErrorResponse

interface DV360ListAudiencesResponse extends DV360ErrorResponse {
  firstPartyAndPartnerAudiences?: DV360Audience[]
  nextPageToken?: string
}

const DISPLAY_NAME_EXISTS = /display name already exists/i
const LIST_PAGE_SIZE = 200
const LIST_MAX_PAGES = 10

function authHeaders(token?: string) {
  return {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json; charset=utf-8'
  }
}

function describeError(response: ModifiedResponse<DV360ErrorResponse>): string {
  const message = response.data?.error?.message
  if (message) {
    return message
  }
  return response.ok ? 'the response did not include an audience ID' : `HTTP ${response.status}`
}

export async function getAudience(request: RequestClient, params: getAudienceParams): Promise<DV360Audience> {
  const { advertiserId, audienceId, token, features, statsContext } = params

  const version = getApiVersion(features, statsContext)
  const endpoint = getAudienceEndpoint(version, advertiserId, audienceId)

  const response = await request<DV360AudienceResponse>(endpoint, {
    method: 'GET',
    headers: authHeaders(token),
    throwHttpErrors: false
  })

  if (!response.ok || !response.data?.firstPartyAndPartnerAudienceId) {
    throw new IntegrationError(
      `Failed to retrieve audience ${audienceId} from Display & Video 360: ${describeError(response)}`,
      ErrorCodes.GET_AUDIENCE_FAILED,
      response.ok ? 400 : response.status
    )
  }

  return response.data
}

export async function findAudienceByName(
  request: RequestClient,
  params: Omit<createAudienceRequestParams, 'description' | 'membershipDurationDays' | 'appId' | 'audienceType'>
): Promise<DV360Audience | undefined> {
  const { advertiserId, audienceName, token, features, statsContext } = params

  const version = getApiVersion(features, statsContext)
  const filter = encodeURIComponent(`displayName:"${audienceName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  let pageToken: string | undefined

  for (let page = 0; page < LIST_MAX_PAGES; page++) {
    const endpoint = `${getAudienceEndpoint(version, advertiserId)}&filter=${filter}&pageSize=${LIST_PAGE_SIZE}${
      pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
    }`

    const response = await request<DV360ListAudiencesResponse>(endpoint, {
      method: 'GET',
      headers: authHeaders(token),
      throwHttpErrors: false
    })

    if (!response.ok) {
      throw new IntegrationError(
        `Failed to look up existing audience "${audienceName}" in Display & Video 360: ${describeError(response)}`,
        ErrorCodes.GET_AUDIENCE_FAILED,
        response.status
      )
    }

    const match = response.data?.firstPartyAndPartnerAudiences?.find((a) => a.displayName === audienceName)
    if (match) {
      return match
    }

    pageToken = response.data?.nextPageToken
    if (!pageToken) {
      return undefined
    }
  }

  return undefined
}

export async function createAudience(
  request: RequestClient,
  params: createAudienceRequestParams
): Promise<{ audienceId: string; connectedToExisting: boolean }> {
  const {
    advertiserId,
    audienceName,
    description,
    membershipDurationDays,
    audienceType,
    appId,
    token,
    features,
    statsContext
  } = params

  const version = getApiVersion(features, statsContext)
  const endpoint = getAudienceEndpoint(version, advertiserId)

  const response = await request<DV360AudienceResponse>(endpoint, {
    method: 'POST',
    headers: authHeaders(token),
    json: {
      displayName: audienceName,
      audienceType: audienceType,
      membershipDurationDays: membershipDurationDays,
      description: description,
      audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
      firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY',
      appId: appId
    },
    throwHttpErrors: false
  })

  const audienceId = response.data?.firstPartyAndPartnerAudienceId
  if (response.ok && audienceId) {
    return { audienceId, connectedToExisting: false }
  }

  if (response.status === 400 && DISPLAY_NAME_EXISTS.test(response.data?.error?.message ?? '')) {
    const existing = await findAudienceByName(request, { advertiserId, audienceName, token, features, statsContext })
    const existingId = existing?.firstPartyAndPartnerAudienceId

    if (existingId) {
      if (existing.audienceType !== audienceType) {
        throw new IntegrationError(
          `An audience named "${audienceName}" already exists in Display & Video 360 (ID ${existingId}) but its type is ${existing.audienceType}, not ${audienceType}. Rename the audience, or connect to it by populating the "Existing Audience ID" setting with a matching Audience Type.`,
          ErrorCodes.CREATE_AUDIENCE_FAILED,
          400
        )
      }
      return { audienceId: existingId, connectedToExisting: true }
    }
  }

  throw new IntegrationError(
    `Failed to create audience in Display & Video 360: ${describeError(response)}`,
    ErrorCodes.CREATE_AUDIENCE_FAILED,
    response.ok ? 400 : response.status
  )
}

export async function editDeviceMobileIds(
  request: RequestClient,
  payloads: DeviceIdPayload[],
  operation: 'add' | 'remove',
  statsContext?: StatsContext, // Adjust type based on actual stats context
  features?: Features
) {
  // Assume all payloads are for the same audience/advertiser (use first)
  const { external_id: audienceId, advertiser_id: advertiserId } = payloads[0]

  // Collect all mobileDeviceIds into a flat array
  const allMobileDeviceIds = payloads.flatMap((p) =>
    Array.isArray(p.mobileDeviceIds) ? p.mobileDeviceIds : [p.mobileDeviceIds]
  )

  //Format the endpoint

  const version = getApiVersion(features, statsContext)
  const endpoint = getEditCustomerMatchMembersEndpoint(version, audienceId)

  // Prepare the request payload
  const mobileDeviceIdList = {
    mobileDeviceIds: allMobileDeviceIds,
    consent: {
      adUserData: CONSENT_STATUS_GRANTED,
      adPersonalization: CONSENT_STATUS_GRANTED
    }
  }

  // Convert the payload to string if needed
  const requestPayload = JSON.stringify({
    advertiserId: advertiserId,
    ...(operation === 'add' ? { addedMobileDeviceIdList: mobileDeviceIdList } : {}),
    ...(operation === 'remove' ? { removedMobileDeviceIdList: mobileDeviceIdList } : {})
  })
  const response = await request<DV360editCustomerMatchResponse>(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: requestPayload
  })
  const responseAudienceId = response.data.firstPartyAndPartnerAudienceId
  if (!response.data || !responseAudienceId) {
    statsContext?.statsClient?.incr('addCustomerMatchMembers.error', allMobileDeviceIds.length, statsContext?.tags)
    throw new IntegrationError(
      `API returned error: ${response.data?.error || 'Unknown error'}`,
      'API_REQUEST_ERROR',
      400
    )
  }

  statsContext?.statsClient?.incr('addCustomerMatchMembers.success', allMobileDeviceIds.length, statsContext?.tags)
  return response.data
}

// Helper to build contactInfoList
function buildContactInfoList(contactInfos: Record<string, string>[]): {
  contactInfos: Record<string, string>[]
  consent: { adUserData: string; adPersonalization: string }
} {
  return {
    contactInfos,
    consent: {
      adUserData: CONSENT_STATUS_GRANTED,
      adPersonalization: CONSENT_STATUS_GRANTED
    }
  }
}

// Helper to build request payload
function buildRequestPayload(
  advertiserId: string,
  contactInfoList: {
    contactInfos: Record<string, string>[]
    consent: { adUserData: string; adPersonalization: string }
  },
  operation: 'add' | 'remove'
) {
  return JSON.stringify({
    advertiserId,
    ...(operation === 'add' ? { addedContactInfoList: contactInfoList } : {}),
    ...(operation === 'remove' ? { removedContactInfoList: contactInfoList } : {})
  })
}

export async function editContactInfo(
  request: RequestClient,
  payloads: Payload[],
  operation: 'add' | 'remove',
  statsContext?: StatsContext,
  features?: Features
) {
  if (!payloads || payloads.length === 0) return

  // TODO: remove this check, the framework should handle this
  const validPayloads = payloads.filter(
    (payload) =>
      payload.emails !== undefined ||
      payload.phoneNumbers !== undefined ||
      payload.firstName !== undefined ||
      payload.lastName !== undefined
  )
  if (validPayloads.length === 0) return

  // Assume all payloads are for the same audience/advertiser (use first)
  const { external_id: audienceId, advertiser_id: advertiserId } = validPayloads[0]
  if (!audienceId || !advertiserId) {
    throw new IntegrationError('Missing required audience or advertiser ID', 'MISSING_REQUIRED_FIELD', 400)
  }
  const contactInfos = validPayloads.map(processPayload)
  const contactInfoList = buildContactInfoList(contactInfos)
  const requestPayload = buildRequestPayload(advertiserId, contactInfoList, operation)
  const version = getApiVersion(features, statsContext)
  const endpoint = getEditCustomerMatchMembersEndpoint(version, audienceId)
  const response = await request<DV360editCustomerMatchResponse>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: requestPayload
  })
  statsContext?.statsClient?.incr('addCustomerMatchMembers.success', contactInfos.length, statsContext?.tags)
  return response.data
}

function normalizeAndHash(data: string) {
  // Normalize the data
  const normalizedData = data.toLowerCase().trim() // Example: Convert to lowercase and remove leading/trailing spaces
  // Hash the normalized data using SHA-256
  return processHashing(normalizedData, 'sha256', 'hex')
}

function processPayload(payload: Payload) {
  const result: { [key: string]: string } = {}

  // Normalize and hash only if the value is defined
  if (payload.emails) {
    result.hashedEmails = normalizeAndHash(payload.emails)
  }
  if (payload.phoneNumbers) {
    result.hashedPhoneNumbers = normalizeAndHash(payload.phoneNumbers)
  }
  if (payload.zipCodes) {
    result.zipCodes = payload.zipCodes
  }
  if (payload.firstName) {
    result.hashedFirstName = normalizeAndHash(payload.firstName)
  }
  if (payload.lastName) {
    result.hashedLastName = normalizeAndHash(payload.lastName)
  }
  if (payload.countryCode) {
    result.countryCode = payload.countryCode
  }

  return result
}
