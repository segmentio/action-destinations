import { Features, IntegrationError, RequestClient, StatsContext } from '@segment/actions-core'
import { Payload } from './addToAudContactInfo/generated-types'
import { Payload as DeviceIdPayload } from './addToAudMobileDeviceId/generated-types'
import { processHashing } from '../../lib/hashing-utils'

export const API_VERSION = 'v3'
export const CANARY_API_VERSION = 'v4'
export const FLAGON_NAME = 'first-party-dv360-canary-version'

const DV360API = `https://displayvideo.googleapis.com/`
const CONSENT_STATUS_GRANTED = 'CONSENT_STATUS_GRANTED' // Define consent status

export function getApiVersion(features?: Features, statsContext?: StatsContext): string {
  const statsClient = statsContext?.statsClient
  const tags = statsContext?.tags
  const version = features && features[FLAGON_NAME] ? CANARY_API_VERSION : API_VERSION
  tags?.push(`version:${version}`)
  statsClient?.incr('dv360_api_version', 1, tags)
  return version
}

function getAudienceEndpoint(version: string, advertiserId: string, audienceId?: string): string {
  if (audienceId) {
    if (version === CANARY_API_VERSION) {
      return DV360API + 'v4/firstPartyAndPartnerAudiences/' + `${audienceId}?advertiserId=${advertiserId}`
    } else {
      return DV360API + 'v3/firstAndThirdPartyAudiences/' + `${audienceId}?advertiserId=${advertiserId}`
    }
  } else {
    if (version === CANARY_API_VERSION) {
      return DV360API + 'v4/firstPartyAndPartnerAudiences' + `?advertiserId=${advertiserId}`
    } else {
      return DV360API + 'v3/firstAndThirdPartyAudiences' + `?advertiserId=${advertiserId}`
    }
  }
}

function getEditCustomerMatchMembersEndpoint(version: string, audienceId: string): string {
  if (version === CANARY_API_VERSION) {
    return DV360API + 'v4/firstPartyAndPartnerAudiences/' + audienceId + ':editCustomerMatchMembers'
  } else {
    return DV360API + 'v3/firstAndThirdPartyAudiences/' + audienceId + ':editCustomerMatchMembers'
  }
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
  firstAndThirdPartyAudienceId?: string
  firstPartyAndPartnerAudienceId?: string
  error: [
    {
      code: string
      message: string
      status: string
    }
  ]
}

export const createAudienceRequest = (
  request: RequestClient,
  params: createAudienceRequestParams
): Promise<Response> => {
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

  return request(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    json: {
      displayName: audienceName,
      audienceType: audienceType,
      membershipDurationDays: membershipDurationDays,
      description: description,
      audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
      firstAndThirdPartyAudienceType:
        features && features[FLAGON_NAME] ? undefined : 'FIRST_AND_THIRD_PARTY_AUDIENCE_TYPE_FIRST_PARTY',
      firstPartyAndPartnerAudienceType: features && features[FLAGON_NAME] ? 'TYPE_FIRST_PARTY' : undefined,
      appId: appId
    }
  })
}

export const getAudienceRequest = (request: RequestClient, params: getAudienceParams): Promise<Response> => {
  const { advertiserId, audienceId, token, features, statsContext } = params

  const version = getApiVersion(features, statsContext)
  const endpoint = getAudienceEndpoint(version, advertiserId, audienceId)

  return request(endpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
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
  const responseAudienceId =
    features && features[FLAGON_NAME]
      ? response.data.firstPartyAndPartnerAudienceId
      : response.data.firstAndThirdPartyAudienceId
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
