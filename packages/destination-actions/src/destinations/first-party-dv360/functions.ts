import { IntegrationError, RequestClient, StatsContext } from '@segment/actions-core'
import { AudienceSettings } from './generated-types'
import { Payload } from './addToAudContactInfo/generated-types'
import { createHash } from 'crypto'
import { Payload as DeviceIdPayload } from './addToAudMobileDeviceId/generated-types'

const DV360API = `https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences`
const MAX_REQUEST_SIZE = 500000
const CONSENT_STATUS_GRANTED = 'CONSENT_STATUS_GRANTED' // Define consent status

interface createAudienceRequestParams {
  advertiserId: string
  audienceName: string
  description?: string
  membershipDurationDays: string
  appId?: string
  audienceType: string
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

export async function addDeviceMobileIds(
  request: RequestClient,
  settings: AudienceSettings | undefined,
  payloads: DeviceIdPayload[],
  statsContext?: StatsContext // Adjust type based on actual stats context
) {
  if (!settings) {
    throw new IntegrationError('No Audience Settings found in payload', 'INVALID_REQUEST_DATA', 400)
  }

  const audienceId = payloads[0].external_id
  //Format the endpoint
  const endpoint = DV360API + '/' + audienceId + ':editCustomerMatchMembers'
  // Prepare the request payload
  const mobileDeviceIdList = {
    mobileDeviceIds: [payloads[0].mobileDeviceIds],
    consent: {
      adUserData: CONSENT_STATUS_GRANTED,
      adPersonalization: CONSENT_STATUS_GRANTED
    }
  }

  // Convert the payload to string if needed
  const requestPayload = JSON.stringify({
    advertiserId: settings.advertiserId,
    addedMobileDeviceIdList: mobileDeviceIdList
  })

  console.log('MobileDeviceId:', mobileDeviceIdList)
  const response = await request<DV360editCustomerMatchResponse>(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${settings.token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: requestPayload
  })
  // Handle the API response generically
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

export async function addContactInfo(
  request: RequestClient,
  settings: AudienceSettings | undefined,
  payloads: Payload[],
  statsContext?: StatsContext // Adjust type based on actual stats context
) {
  console.log('Payload:', payloads)
  const audienceId = payloads[0].external_id
  //Format the endpoint
  const endpoint = DV360API + '/' + audienceId + ':editCustomerMatchMembers'
  console.log('endpoint', endpoint)

  if (!settings) {
    throw new IntegrationError('No Audience Settings found in payload', 'INVALID_REQUEST_DATA', 400)
  }

  const payload = payloads[0]

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
    advertiserId: settings.advertiserId,
    addedContactInfoList: contactInfoList
  })

  // Ensure the request data size is within acceptable limits
  console.log('FIX')
  const requestSize = Buffer.byteLength(requestPayload, 'utf8')
  if (requestSize > MAX_REQUEST_SIZE) {
    statsContext?.statsClient?.incr('addCustomerMatchMembers.error', 1, statsContext?.tags)
    throw new IntegrationError(
      `Request data size exceeds limit of ${MAX_REQUEST_SIZE} bytes`,
      'INVALID_REQUEST_DATA',
      400
    )
  }

  console.log('Payload Formatted:', requestPayload)
  console.log('Token', settings.token)

  const response = await request<DV360editCustomerMatchResponse>(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${settings.token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: requestPayload
  })

  // Handle the API response generically
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

function normalizeAndHash(data: string) {
  // Normalize the data
  const normalizedData = data.toLowerCase().trim() // Example: Convert to lowercase and remove leading/trailing spaces
  // Hash the normalized data using SHA-256
  const hash = createHash('sha256')
  hash.update(normalizedData)
  return hash.digest('hex')
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
