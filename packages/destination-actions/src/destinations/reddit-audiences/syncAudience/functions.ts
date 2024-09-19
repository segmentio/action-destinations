import { IntegrationError, PayloadValidationError, RequestClient } from '@segment/actions-core'
// import { AudienceSettings } from '@segment/actions-core/destination-kit' <- was throwing an error
import { Payload } from '../syncAudience/generated-types'
import { Settings, AudienceSettings } from '../generated-types'
import { PopulateAudienceJSON } from '../syncAudience/types'

import { createHash } from 'crypto'



export async function send(request: RequestClient, payloads: Payload[], settings: Settings, audienceSettings: AudienceSettings) {

  const audienceId = payloads[0].external_audience_id

  if (!audienceId) {
    throw new PayloadValidationError('External Audience ID is required.')
  }

  const email_schema_name = 'EMAIL_SHA256'
  const maid_schema_name = 'MAID_SHA256'
  const action_type = 'ADD' // Can also be DELETE

  // check if payload is hashed, otherwise hash the payload
  const user_payload = createPayload(payloads)

  // Add columns to the column_order
  const schema_columns = createSchema(email_schema_name, maid_schema_name, payloads)

  if (user_payload.length > 0) {
    const audience_values = {
      action_type: action_type,
      column_order: schema_columns,
      user_data: [user_payload]
    }
    await updateAudience(request, audience_values, payloads)
  } else {
    throw new PayloadValidationError('At least one of Email Id or Advertising ID must be provided.')
  }
}

async function updateAudience(
  request: RequestClient,
  audience_data: any,
  payload: Payload[]
) {
  const updateAudienceUrl = `https://ads-api.reddit.com/api/v3/custom_audiences/${payload[0].external_audience_id}/users`
  const max_size = payload[0].batch_size

  // last time we met - splitArray function sounded like it was unncessary
  // reinserted it for now but wanted to check how to approach it otherwise to make sure
  // the data is under the limit
  const user_data_chunks = splitArray(audience_data.user_data, max_size ?? 2500)

  for (const entry of user_data_chunks) {
    const json_payload = {
      data: {
        ...audience_data,
        user_data: entry
      }
    }
    // await sendRequest(request, 'PATCH', updateAudienceUrl, json_payload)
    const response = await request(updateAudienceUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // note: what is the best way to fetch the token
      },
      json: json_payload,
      throwHttpErrors: true
    })

    const r = await response.status
    return r
  }
}

function createSchema(
  email_schema_name: string,
  maid_schema_name: string,
  payloads: Payload[]
) {
  const schema_columns: string[] = []

  payloads.forEach((payload) => {
    // Check if the payload has any email. Add to Schema if so.
    if (payload.email) {
      schema_columns.push(email_schema_name);
    }

    // Check for any iosIDFA or androidIDFA in the payload. Add to Schema if so.
    if (payload.iosIDFA || payload.androidIDFA) {
      schema_columns.push(maid_schema_name);
    }
  })

  return schema_columns
}

function splitArray<T>(array: T[], chunkSize: number): T[][] {
  const split_array: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    split_array.push(array.slice(i, i + chunkSize))
  }
  return split_array
}

function createPayload(payloads: Payload[]) {
  const hashed_payload: any = []
  payloads.forEach((payload) => {
    if (!payload.email && !payload.iosIDFA && !payload.androidIDFA) return

    if (payload.email) {
      if (!checkHash(payload.email)) {
        payload.email = hashEmail(payload.email)
      }
      hashed_payload.push(payload.email || '')
    }

    if (payload.iosIDFA) {
      if (!checkHash(payload.iosIDFA)) {
        const hash = createHash('sha256')
        hash.update(payload.iosIDFA)
        payload.iosIDFA = hash.digest('hex')
      }
      hashed_payload.push(payload.iosIDFA || '')
    }

    if (payload.androidIDFA) {
      if (!checkHash(payload.androidIDFA)) {
        const hash = createHash('sha256')
        hash.update(payload.androidIDFA)
        payload.androidIDFA = hash.digest('hex')
      }
      hashed_payload.push(payload.androidIDFA || '')
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

// canonicalize the email to follow Reddit email formats before hashing
function canonicalizeEmail(value: string): string {
  const localPartAndDomain = value.split('@')
  const localPart = localPartAndDomain[0].replace(/\./g, '').split('+')[0]
  return `${localPart}@${localPartAndDomain[1].toLowerCase()}`
}

