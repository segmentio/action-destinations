import { IntegrationError, RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Payload as AddToAudiencePayload } from './addToAudience/generated-types'
import { createHash } from 'crypto'


let token = ''

export async function audienceSync(
  request: RequestClient,
  payloads: AddToAudiencePayload[]
) {
  let get_audience = getAudience(request, payloads[0])

  schemaCheck(payloads)

  const user_payload = createPayload(payloads)

  const schema_columns = createSchema(payloads)

  console.log('payload length:', user_payload[0].length)

  if (user_payload.length > 0) {
    const audienceValues = {
      action_type: 'ADD',
      column_order: schema_columns,
      user_data: user_payload
    }

    let res
    res = await updateAudience(request, audienceValues, payloads[0])
  }
  else {
    throw new PayloadValidationError('At least one of Email Id or Advertising ID must be provided.')
  }

}


export async function updateAudience(request: RequestClient, data: {}, payload: AddToAudiencePayload) {
  const updateAudienceUrl = `https://ads-api.reddit.com/api/v3/custom_audiences/${payload.audience_id}/users`
  const json_payload = {
    data
  }
  console.log(data)

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

export function createSchema(payload: AddToAudiencePayload[]) {
  const schema_columns = []
  if (payload[0].send_email == true) {
    schema_columns.push('EMAIL_SHA256')
  }
  if (payload[0].send_maid == true) {
    schema_columns.push('MAID_SHA256')
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

export function createPayload(payloads: AddToAudiencePayload[]) {
  const audience_payload: string[][] = []

  payloads.forEach((payload: AddToAudiencePayload) => {
    let user_email: string[] = []
    let user_maid: string[] = []

    console.log('email payload:', payload.email)
    if (!payload.email && !payload.maid) {
      return
    }

    if (payload.send_email == true) {
      if (payload.email) {
        if (!checkHash(payload.email)) {
          payload.email = hashEmail(payload.email)
        }
        console.log('email payload: ', payload.email)
        user_email.push(payload.email)
      }
    }

    if (payload.send_maid == true) {
      if (payload.maid) {
        if (!checkHash(payload.maid)) {
          payload.maid = sha256Hash(payload.maid)
        }
        console.log('maid payload: ', payload.maid)
        user_maid.push(payload.maid)
      }
    }

    if (payload.send_email == true && payload.send_maid == false) {
      audience_payload.push(user_email)
    }
    if (payload.send_email == false && payload.send_maid == true) {
      audience_payload.push(user_maid)
    }
    if (payload.send_email == true && payload.send_maid == true) {
      audience_payload.push(user_email, user_maid)
    }
    console.log('audience_payload:     ', audience_payload)
  })
  return audience_payload
}

export function checkHash(value: any): boolean {
  const sha256HashedRegex = /^[a-f0-9]{64}$/i
  return sha256HashedRegex.test(value)
}

export function hashEmail(value: any): string {
  const email = normalizeEmail(value)
  const hash = createHash('sha256')

  hash.update(email)
  const hashed_email = hash.digest('hex')

  return hashed_email
}

export function sha256Hash(maid: any): string {
  const hash = createHash('sha256')
  hash.update(maid)
  const hashed_maid = hash.digest('hex')

  return hashed_maid
}

export function normalizeEmail(value: string): string {
  const localPartAndDomain = value.split('@')
  if (localPartAndDomain.length != 2) {
    return ''
  }
  const localPart = localPartAndDomain[0]
  const cleanedLocalPart = localPart.replace(/\./g, '').split('+')[0]
  localPartAndDomain[0] = cleanedLocalPart
  return localPartAndDomain.join('@').toLowerCase()
}

export function schemaCheck(payloads: AddToAudiencePayload[]) {
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
