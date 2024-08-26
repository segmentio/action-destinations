import { IntegrationError, RequestClient, PayloadValidationError, ModifiedResponse } from '@segment/actions-core'
import { Payload as AddToAudiencePayload } from './addToAudience/generated-types'
import { Settings } from './generated-types'
import { AudienceSettings } from './generated-types'
import { createHash } from 'crypto'


let token = ''

export async function audienceSync(
  request: RequestClient,
  payloads: AddToAudiencePayload[]
) {
  let get_audience = getAudience(request, payloads[0])

  const schema = createSchema(payloads[0])

  const user_payload = createPayload(payloads)
  console.log(schema)
  console.log(user_payload)

}

export function createSchema(payload: AddToAudiencePayload) {
  console.log('start createSchema function')
  const schema_columns = []
  if (payload.send_email == true) {
    schema_columns.push('EMAIL_SHA256')
  }
  if (payload.send_maid == true) {
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
  const audience_payload: {}[] = []

  payloads.forEach((payload: AddToAudiencePayload) => {
    const user_data = []

    if (payload.send_email == true) {
      if (!checkHash(payload.email)) {
        payload.email = hashEmail(payload.email)
      }
      user_data.push(payload.email)
    }

    audience_payload.push(user_data)

  })

  return audience_payload
}

export function checkHash(value: any): boolean {
  const sha256HashedRegex = /^[a-f0-9]{64}$/i
  return sha256HashedRegex.test(value)
}

export function hashEmail(value: any) {
  const email = normalizeEmail(value)
  const hash = createHash('sha256')

  hash.update(email)
  const hashed_email = hash.digest('hex')

  return hashed_email
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