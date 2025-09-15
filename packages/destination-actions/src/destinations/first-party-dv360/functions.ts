import { Features, IntegrationError, RequestClient, StatsContext } from '@segment/actions-core'
import { Payload } from './addToAudContactInfo/generated-types'
import { Payload as DeviceIdPayload } from './addToAudMobileDeviceId/generated-types'
import { processHashing } from '../../lib/hashing-utils'

const DV360API = `https://displayvideo.googleapis.com/`
const CONSENT_STATUS_GRANTED = 'CONSENT_STATUS_GRANTED' // Define consent status
export const FLAGON_NAME_FIRST_PARTY_DV360_VERSION_UPDATE = 'actions-first-party-dv360-version-update'

interface createAudienceRequestParams {
  advertiserId: string
  audienceName: string
  description?: string
  membershipDurationDays: string
  audienceType: string
  appId?: string
  token?: string
  features?: Features
}

interface getAudienceParams {
  advertiserId: string
  audienceId: string
  token?: string
  features?: Features
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
  const { advertiserId, audienceName, description, membershipDurationDays, audienceType, appId, token, features } =
    params

  let endpoint
  if (features && features[FLAGON_NAME_FIRST_PARTY_DV360_VERSION_UPDATE]) {
    endpoint = DV360API + 'v4/firstPartyAndPartnerAudiences' + `?advertiserId=${advertiserId}`
  } else {
    endpoint = DV360API + 'v3/firstAndThirdPartyAudiences' + `?advertiserId=${advertiserId}`
  }

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
        features && features[FLAGON_NAME_FIRST_PARTY_DV360_VERSION_UPDATE]
          ? undefined
          : 'FIRST_AND_THIRD_PARTY_AUDIENCE_TYPE_FIRST_PARTY',
      firstPartyAndPartnerAudienceType:
        features && features[FLAGON_NAME_FIRST_PARTY_DV360_VERSION_UPDATE] ? 'TYPE_FIRST_PARTY' : undefined,
      appId: appId
    }
  })
}

export const getAudienceRequest = (request: RequestClient, params: getAudienceParams): Promise<Response> => {
  const { advertiserId, audienceId, token, features } = params
  let endpoint
  if (features && features[FLAGON_NAME_FIRST_PARTY_DV360_VERSION_UPDATE]) {
    endpoint = DV360API + 'v4/firstPartyAndPartnerAudiences' + `/${audienceId}?advertiserId=${advertiserId}`
  } else {
    endpoint = DV360API + 'v3/firstAndThirdPartyAudiences' + `/${audienceId}?advertiserId=${advertiserId}`
  }

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
  statsContext?: StatsContext // Adjust type based on actual stats context,
) {
  // Assume all payloads are for the same audience/advertiser (use first)
  const { external_id: audienceId, advertiser_id: advertiserId } = payloads[0]

  // Collect all mobileDeviceIds into a flat array
  const allMobileDeviceIds = payloads.flatMap((p) =>
    Array.isArray(p.mobileDeviceIds) ? p.mobileDeviceIds : [p.mobileDeviceIds]
  )

  //Format the endpoint
  const endpoint = DV360API + '/' + audienceId + ':editCustomerMatchMembers'

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
  if (!response.data || !response.data.firstAndThirdPartyAudienceId) {
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
  let endpoint
  if (features && features[FLAGON_NAME_FIRST_PARTY_DV360_VERSION_UPDATE]) {
    endpoint = DV360API + 'v4/firstPartyAndPartnerAudiences/' + audienceId + ':editCustomerMatchMembers'
  } else {
    endpoint = DV360API + 'v3/firstAndThirdPartyAudiences/' + audienceId + ':editCustomerMatchMembers'
  }
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
