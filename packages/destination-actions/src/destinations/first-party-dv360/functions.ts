import { IntegrationError, RequestClient, StatsContext } from '@segment/actions-core'
import { Payload } from './addToAudContactInfo/generated-types'
import { Payload as DeviceIdPayload } from './addToAudMobileDeviceId/generated-types'
import { processHashing } from '../../lib/hashing-utils'

const DV360API = `https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences`
const CONSENT_STATUS_GRANTED = 'CONSENT_STATUS_GRANTED' // Define consent status

interface createAudienceRequestParams {
  advertiserId: string
  audienceName: string
  description?: string
  membershipDurationDays: string
  audienceType: string
  appId?: string
  token?: string
}

interface getAudienceParams {
  advertiserId: string
  audienceId: string
  token?: string
}

interface DV360editCustomerMatchResponse {
  firstAndThirdPartyAudienceId: string
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
  const { advertiserId, audienceName, description, membershipDurationDays, audienceType, appId, token } = params

  const endpoint = DV360API + `?advertiserId=${advertiserId}`

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
      firstAndThirdPartyAudienceType: 'FIRST_AND_THIRD_PARTY_AUDIENCE_TYPE_FIRST_PARTY',
      appId: appId
    }
  })
}

export const getAudienceRequest = (request: RequestClient, params: getAudienceParams): Promise<Response> => {
  const { advertiserId, audienceId, token } = params

  const endpoint = DV360API + `/${audienceId}?advertiserId=${advertiserId}`

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
  statsContext?: StatsContext // Adjust type based on actual stats context
) {
  const payload = payloads[0]
  const audienceId = payload.external_id

  //Check if mobile device id exists otherwise drop the event
  if (payload.mobileDeviceIds === undefined) {
    return
  }

  //Format the endpoint
  const endpoint = DV360API + '/' + audienceId + ':editCustomerMatchMembers'

  // Prepare the request payload
  const mobileDeviceIdList = {
    mobileDeviceIds: [payload.mobileDeviceIds],
    consent: {
      adUserData: CONSENT_STATUS_GRANTED,
      adPersonalization: CONSENT_STATUS_GRANTED
    }
  }

  // Convert the payload to string if needed
  const requestPayload = JSON.stringify({
    advertiserId: payload.advertiser_id,
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
    statsContext?.statsClient?.incr('addCustomerMatchMembers.error', 1, statsContext?.tags)
    throw new IntegrationError(
      `API returned error: ${response.data?.error || 'Unknown error'}`,
      'API_REQUEST_ERROR',
      400
    )
  }

  statsContext?.statsClient?.incr('addCustomerMatchMembers.success', 1, statsContext?.tags)
  return response.data
}

export async function editContactInfo(
  request: RequestClient,
  payloads: Payload[],
  operation: 'add' | 'remove',
  statsContext?: StatsContext
) {
  const payload = payloads[0]
  const audienceId = payloads[0].external_id

  //Check if one of the required identifiers exists otherwise drop the event
  if (
    payload.emails === undefined &&
    payload.phoneNumbers === undefined &&
    payload.firstName === undefined &&
    payload.lastName === undefined
  ) {
    return
  }

  //Format the endpoint
  const endpoint = DV360API + '/' + audienceId + ':editCustomerMatchMembers'

  // Prepare the request payload
  const contactInfoList = {
    contactInfos: [processPayload(payload)],
    consent: {
      adUserData: CONSENT_STATUS_GRANTED,
      adPersonalization: CONSENT_STATUS_GRANTED
    }
  }

  // Convert the payload to string if needed
  const requestPayload = JSON.stringify({
    advertiserId: payload.advertiser_id,
    ...(operation === 'add' ? { addedContactInfoList: contactInfoList } : {}),
    ...(operation === 'remove' ? { removedContactInfoList: contactInfoList } : {})
  })

  const response = await request<DV360editCustomerMatchResponse>(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: requestPayload
  })

  statsContext?.statsClient?.incr('addCustomerMatchMembers.success', 1, statsContext?.tags)
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
