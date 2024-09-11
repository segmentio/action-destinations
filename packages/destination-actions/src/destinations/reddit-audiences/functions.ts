import { IntegrationError, RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Payload as AddToAudiencePayload } from './addToAudience/generated-types'
import { Payload as CreateAudiencePayload } from './createAudience/generated-types'
import { createHash } from 'crypto'


let token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzI2MDgwNDk2Ljg5MjU5OSwiaWF0IjoxNzI1OTk0MDk2Ljg5MjU5OSwianRpIjoiVjVFbkJWZFdERVpRSzJMWThnaWFxZGlJTU43MW1BIiwiY2lkIjoiOWtYLUJWQlFTVWlZWEx4QmZGdzcyZyIsImxpZCI6InQyXzN4OWkyMnQwIiwiYWlkIjoidDJfM3g5aTIydDAiLCJsY2EiOjE1NjAyMDQyNTg0MzMsInNjcCI6ImVKeUtWaXBLVFV4UjBsRktUQ21Hc2pJeWkwdnlpeW9oWXFrcG1TVVFWbkotWGxscVVYRm1mbDZ4VWl3Z0FBRF9fd0NaRXc0IiwicmNpZCI6IjFRc3Q1ZFJnM1lrZkFHb3VJYnp2a3RzOGN6el9pOHU1Y3p3Z05vV2pHWmciLCJmbG8iOjN9.NsnheRfU2KBYROnc6WGXhY28G_0tZgzhlPPk2L-7bntuJ5tAqgNGqSJ_yojUczf40lollUYlpEN1-bN8mEH5g6UZdD_Y9fK0QcgVMtQ4F_Q-D4ph7JlQDuMOF6fpZim3jD8N0UXst100hOE0GEVbrKOmGovNY_wQuqBduo8Z4a-kuqWKN4pJjs4juYp6-c1B1ILu2M87VhaJwsvs1aIM8q3deOadJlIsW2hcPBYKWBAeALnsffDbc_4_7Qltp3TkkfgagKD631WePF8xSrwkJyBqUvPBGqA5S4P6VT_pZL3UNpb_BeUsfgxcGOWm6LDXEMjmV5gEzH4FHtnQQB3Pbw'

export async function audienceSync(
  request: RequestClient,
  payload: AddToAudiencePayload[],
  action: string
) {
  let get_audience = getAudience(request, payload[0])
  // can we store the audience as a variable

  const email_schema_name = 'EMAIL_SHA256'
  const maid_schema_name = 'MAID_SHA256'

  schemaCheck(payload)

  const schema_columns = createSchema(payload, email_schema_name, maid_schema_name)
  const user_payload = createPayload(payload)

  if (user_payload.length > 0) {
    let res
    const audience_values = {
      action_type: action,
      column_order: schema_columns,
      user_data: [user_payload]
    }

    res = await updateAudience(request, audience_values, payload[0])
  }

  else {
    throw new PayloadValidationError('At least one of Email Id or Advertising ID must be provided.')
  }

}

async function updateAudience(request: RequestClient, audience_data: any, settings_payload: AddToAudiencePayload) {
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
    console.log('json-payload:', json_payload.data)

    const response = await request(updateAudienceUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      json: json_payload,
      throwHttpErrors: true
    })

    const r = await response.status
    console.log('HTTP Status Code:', r)
    return r
  }
}

function createSchema(payload: AddToAudiencePayload[], email_schema_name: string, maid_schema_name: string) {
  const schema_columns = []
  if (payload[0].send_email == true) {
    schema_columns.push(email_schema_name)
  }
  if (payload[0].send_maid == true) {
    schema_columns.push(maid_schema_name)
  }

  return schema_columns
}

export async function getAudience(request: RequestClient, payload: AddToAudiencePayload) {
  const getAudienceUrl = `https://ads-api.reddit.com/api/v3/custom_audiences/${payload.audience_id}`
  const response = await request(getAudienceUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  const r = await response.json()
  return r
}

function createPayload(payloads: AddToAudiencePayload[]) {
  const hashed_payload: any = []

  payloads.forEach((payload: AddToAudiencePayload) => {
    if (!payload.email && !payload.maid) {
      return
    }

    if (payload.send_email == true) {
      if (payload.email) {
        if (!checkHash(payload.email)) {
          payload.email = hashEmail(payload.email)
        }
      }

      if (!payload.email) {
        payload.email = ''
      }
      hashed_payload.push(payload.email)
    }

    if (payload.send_maid == true) {
      if (payload.maid) {
        if (!checkHash(payload.maid)) {
          const hash = createHash('sha256')
          hash.update(payload.maid)
          const hashed_maid = hash.digest('hex')
          payload.maid = hashed_maid
        }
      }
      if (!payload.maid) {
        payload.maid = ''
      }
      hashed_payload.push(payload.maid)
    }
  })
  return hashed_payload
}

function checkHash(value: any): boolean {
  const sha256HashedRegex = /^[a-f0-9]{64}$/i
  return sha256HashedRegex.test(value)
}

function hashEmail(value: any): string {
  // first canonicalize the email value
  const email = canonicalizeEmail(value)
  const hash = createHash('sha256')

  hash.update(email)
  const hashed_email = hash.digest('hex')

  return hashed_email
}

function canonicalizeEmail(value: string): string {
  const localPartAndDomain = value.split('@')
  if (localPartAndDomain.length != 2) {
    return ''
  }
  const localPart = localPartAndDomain[0]
  const cleanedLocalPart = localPart.replace(/\./g, '').split('+')[0]
  localPartAndDomain[0] = cleanedLocalPart
  return localPartAndDomain.join('@').toLowerCase()
}

function schemaCheck(payloads: AddToAudiencePayload[]) {
  if (
    payloads[0].send_email === false &&
    payloads[0].send_maid === false
  ) {
    throw new IntegrationError(
      'At least one of `Send Email` or `Send Advertising ID` must be set to `true`.',
      'INVALID_SETTINGS',
      400
    )
  }
}


export async function createAudience(request: RequestClient, payload: CreateAudiencePayload) {
  const audience_type = 'CUSTOMER_LIST'
  const audience_name = payload.audience_name
  const createAudienceUrl = `https://ads-api.reddit.com/api/v3/ad_accounts/${payload.ad_account_id}/custom_audiences`

  // TODO - Check adAccountId regex for a2_ or t2_ prefix - throw error if not
  const request_payload = {
    data: {
      name: audience_name,
      type: audience_type
    }
  }

  const response = await request(createAudienceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(request_payload)
  })
  console.log(response)
  const jsonOutput = await response.json()
  if (!jsonOutput.data['id']) {
    throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
  }

  return response
}

function splitArray<T>(array: T[], chunkSize: number): T[][] {
  const split_array: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    split_array.push(array.slice(i, i + chunkSize));
  }
  return split_array
}