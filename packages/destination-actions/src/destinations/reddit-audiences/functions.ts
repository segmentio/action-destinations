import { IntegrationError, RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Payload as AddToAudiencePayload } from './addToAudience/generated-types'
import { Payload as CreateAudiencePayload } from './createAudience/generated-types'
import { AuthSettings, AudienceResponse } from './types'
import { createHash } from 'crypto'

// Unified send function to handle all API requests
async function sendRequest<T = any>(
  request: RequestClient,
  method: 'GET' | 'POST' | 'PATCH',
  url: string,
  auth: AuthSettings,
  body?: any
): Promise<T> {
  const headers: { [key: string]: string } = {
    Authorization: `Bearer ${auth.accessToken}`,
    'Content-Type': 'application/json',
  }

  const options: any = {
    method,
    headers,
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await request(url, options)

  // Try to handle JSON response data, but fallback to raw response
  const parsedResponse = response.data ?? response; // Default to response if data is undefined
  try {
    return typeof parsedResponse === 'string' ? JSON.parse(parsedResponse) : parsedResponse;
  } catch (error) {
    throw new IntegrationError('Error parsing response JSON', 'INVALID_RESPONSE', 400);
  }
}

// Audience Sync
export async function audienceSync(
  request: RequestClient,
  payload: AddToAudiencePayload[],
  action: string,
  auth: AuthSettings
) {
  await getAudience(request, payload[0], auth)

  const email_schema_name = 'EMAIL_SHA256'
  const maid_schema_name = 'MAID_SHA256'

  schemaCheck(payload)

  const schema_columns = createSchema(payload, email_schema_name, maid_schema_name)
  const user_payload = createPayload(payload)

  if (user_payload.length > 0) {
    const audience_values = {
      action_type: action,
      column_order: schema_columns,
      user_data: [user_payload]
    }
    await updateAudience(request, audience_values, payload[0], auth)
  } else {
    throw new PayloadValidationError('At least one of Email Id or Advertising ID must be provided.')
  }
}

// Update Audience
async function updateAudience(
  request: RequestClient,
  audience_data: any,
  settings_payload: AddToAudiencePayload,
  auth: AuthSettings
) {
  const updateAudienceUrl = `https://ads-api.reddit.com/api/v3/custom_audiences/${settings_payload.audience_id}/users`
  const max_size = 2500

  const user_data_chunks = splitArray(audience_data.user_data, max_size)

  for (const entry of user_data_chunks) {
    const json_payload = {
      data: {
        ...audience_data,
        user_data: entry
      }
    }
    await sendRequest(request, 'PATCH', updateAudienceUrl, auth, json_payload)
  }
}

// Get Audience
export async function getAudience(
  request: RequestClient,
  payload: AddToAudiencePayload,
  auth: AuthSettings
) {
  const getAudienceUrl = `https://ads-api.reddit.com/api/v3/custom_audiences/${payload.audience_id}`
  return await sendRequest(request, 'GET', getAudienceUrl, auth)
}

// Create Audience
export async function createAudience(
  request: RequestClient,
  payload: CreateAudiencePayload,
  auth: AuthSettings
) {
  const audience_type = 'CUSTOMER_LIST'
  const createAudienceUrl = `https://ads-api.reddit.com/api/v3/ad_accounts/${payload.ad_account_id}/custom_audiences`

  const request_payload = {
    data: {
      name: payload.audience_name,
      type: audience_type
    }
  }

  const response = await sendRequest<AudienceResponse>(request, 'POST', createAudienceUrl, auth, request_payload)

  if (!response.data?.id) {
    throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
  }

  return response
}

// Utility functions
function createSchema(
  payload: AddToAudiencePayload[],
  email_schema_name: string,
  maid_schema_name: string
) {
  const schema_columns = []
  if (payload[0].send_email) {
    schema_columns.push(email_schema_name)
  }
  if (payload[0].send_maid) {
    schema_columns.push(maid_schema_name)
  }
  return schema_columns
}

function createPayload(payloads: AddToAudiencePayload[]) {
  const hashed_payload: any = []
  payloads.forEach((payload) => {
    if (!payload.email && !payload.maid) return

    if (payload.send_email && payload.email) {
      if (!checkHash(payload.email)) {
        payload.email = hashEmail(payload.email)
      }
      hashed_payload.push(payload.email || '')
    }

    if (payload.send_maid && payload.maid) {
      if (!checkHash(payload.maid)) {
        const hash = createHash('sha256')
        hash.update(payload.maid)
        payload.maid = hash.digest('hex')
      }
      hashed_payload.push(payload.maid || '')
    }
  })
  return hashed_payload
}

function checkHash(value: string): boolean {
  const sha256HashedRegex = /^[a-f0-9]{64}$/i
  return sha256HashedRegex.test(value)
}

function hashEmail(value: string): string {
  const email = canonicalizeEmail(value)
  const hash = createHash('sha256')
  hash.update(email)
  return hash.digest('hex')
}

function canonicalizeEmail(value: string): string {
  const localPartAndDomain = value.split('@')
  const localPart = localPartAndDomain[0].replace(/\./g, '').split('+')[0]
  return `${localPart}@${localPartAndDomain[1].toLowerCase()}`
}

function schemaCheck(payloads: AddToAudiencePayload[]) {
  if (!payloads[0].send_email && !payloads[0].send_maid) {
    throw new IntegrationError(
      'At least one of `Send Email` or `Send Advertising ID` must be set to `true`.',
      'INVALID_SETTINGS',
      400
    )
  }
}

function splitArray<T>(array: T[], chunkSize: number): T[][] {
  const split_array: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    split_array.push(array.slice(i, i + chunkSize))
  }
  return split_array
}

