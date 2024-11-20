import { IntegrationError, RequestClient, StatsContext } from '@segment/actions-core'
import { Payload } from './addToAudContactInfo/generated-types'
import { createHash } from 'crypto'
import { Payload as DeviceIdPayload } from './addToAudMobileDeviceId/generated-types'

const DV360API = `https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences`
const CONSENT_STATUS_GRANTED = 'CONSENT_STATUS_GRANTED' // Define consent status
const OAUTH_URL = 'https://accounts.google.com/o/oauth2/token'

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

interface RefreshTokenResponse {
  access_token: string
}

type DV360AuthCredentials = { refresh_token: string; access_token: string; client_id: string; client_secret: string }

export const getAuthSettings = (): DV360AuthCredentials => {
  return {
    refresh_token: process.env.ACTIONS_FIRST_PARTY_DV360_REFRESH_TOKEN,
    client_id: process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_ID,
    client_secret: process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET
  } as DV360AuthCredentials
}

// Use the refresh token to get a new access token.
// Refresh tokens, Client_id and secret are long-lived and belong to the DMP.
// Given the short expiration time of access tokens, we need to refresh them periodically.
export const getAuthToken = async (request: RequestClient, settings: DV360AuthCredentials) => {
  if (!settings.refresh_token) {
    throw new IntegrationError('Refresh token is missing', 'INVALID_REQUEST_DATA', 400)
  }

  const { data } = await request<RefreshTokenResponse>(OAUTH_URL, {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: settings.refresh_token,
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'refresh_token'
    })
  })

  return data.access_token
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

  //Get access token
  const authSettings = getAuthSettings()
  const token = await getAuthToken(request, authSettings)

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
      authorization: `Bearer ${token}`,
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

  //Get access token
  const authSettings = getAuthSettings()
  const token = await getAuthToken(request, authSettings)

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
      authorization: `Bearer ${token}`,
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
