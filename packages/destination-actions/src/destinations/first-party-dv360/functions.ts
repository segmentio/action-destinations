import { IntegrationError, RequestClient, StatsContext } from '@segment/actions-core'
import { AudienceSettings } from './generated-types'
import { Payload } from './addToList/generated-types'
import { createHash } from 'crypto'

const DV360API = `https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences`
const MAX_REQUEST_SIZE = 500000
const CONSENT_STATUS_GRANTED = 'CONSENT_STATUS_GRANTED' // Define consent status

interface createAudienceRequestParams {
  advertiserId: string
  audienceName: string
  description?: string
  membershipDurationDays: string
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
  const { advertiserId, audienceName, description, membershipDurationDays, audienceType, token } = params

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
      firstAndThirdPartyAudienceType: 'FIRST_AND_THIRD_PARTY_AUDIENCE_TYPE_FIRST_PARTY'
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

export async function addCustomerMatchMembers(
  request: RequestClient,
  settings: AudienceSettings,
  payloads: Payload[],
  statsContext?: StatsContext // Adjust type based on actual stats context
) {
  console.log('Payload:', payloads)
  // Use the audience ID from the first payload
  const audienceId = payloads[0].external_id
  const endpoint = DV360API + '${audienceId}:editCustomerMatchMembers'

  if (!audienceId) {
    throw new IntegrationError('No external ID found in payload', 'INVALID_REQUEST_DATA', 400)
  }

  // Assuming we're dealing with a single payload
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

  const response = await request<DV360editCustomerMatchResponse>(
    endpoint,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${settings.token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: requestPayload
    }
    // Handle the API response generically
  )

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
    result.hashedEmail = normalizeAndHash(payload.emails)
  }
  if (payload.phoneNumbers) {
    result.hashedPhoneNumber = normalizeAndHash(payload.phoneNumbers)
  }
  if (payload.zipCodes) {
    result.zipCode = normalizeAndHash(payload.zipCodes)
  }
  if (payload.firstName) {
    result.firstName = normalizeAndHash(payload.firstName)
  }
  if (payload.lastName) {
    result.lastName = normalizeAndHash(payload.lastName)
  }
  if (payload.countryCode) {
    result.countryCode = normalizeAndHash(payload.countryCode)
  }

  return result
}
