import { IntegrationError, RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Payload as AddToAudiencePayload } from './addToAudience/generated-types'
import { Payload as CreateAudiencePayload } from './createAudience/generated-types'
import { createHash } from 'crypto'


let token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzI1NzM2MTY3LjM4NDg0LCJpYXQiOjE3MjU2NDk3NjcuMzg0ODM5LCJqdGkiOiJvTFpoUUt4OG5sQlN5aWFhd2paZng4b2JwQjhZUEEiLCJjaWQiOiI5a1gtQlZCUVNVaVlYTHhCZkZ3NzJnIiwibGlkIjoidDJfM3g5aTIydDAiLCJhaWQiOiJ0Ml8zeDlpMjJ0MCIsImxjYSI6MTU2MDIwNDI1ODQzMywic2NwIjoiZUp5S1ZpcEtUVXhSMGxGS1RDbUdzakl5aTB2eWl5b2hZcWtwbVNVUVZuSi1YbGxxVVhGbWZsNnhVaXdnQUFEX193Q1pFdzQiLCJyY2lkIjoiMVFzdDVkUmczWWtmQUdvdUlienZrdHM4Y3p6X2k4dTVjendnTm9XakdaZyIsImZsbyI6M30.NF4oKl1dkaNz-_UK4osY8yHy14wQrSJ8dapfKpBYbeVD5ngVeTQVePhLB6OhbHHZWhzB8GzkmHjr5fhzT2KckFpPWCoJ7HzvwbGZQ_k1pmV14Yzy5fV64ZLcd0yP5v0FVRfvimaeNRUWraDoawhDays1ky3KNgIQRM7Aauei36SX2X5NC44Py1yb2ntfhIckELZCce94pZyvPVIND1hGBb8i4rOoIdNgRk50kuFs_FU_xu97QfkLnHeBz_QYW-YmxY3fK7yc73f7cKEVRb9etcWKcd5jl36_-4WklGbTEmY_rPaF9HVPg49q77HsD8XnhzSdKKJ4-c1Xob43eZUC9Q'

export async function audienceSync(
  request: RequestClient,
  payload: AddToAudiencePayload[],
  action: string
) {
  let get_audience = getAudience(request, payload[0])
  // check audience length and divide by number of requests
  // For division, round it up to the next integer
  // store that as variable
  const email_schema_name = 'EMAIL_SHA256'
  const maid_schema_name = 'MAID_SHA256'

  schemaCheck(payload)

  const schema_columns = createSchema(payload, email_schema_name, maid_schema_name)
  const user_payload = createPayload(payload)


  const max_size = 2500
  const email_array = user_payload[0]
  const maid_array = user_payload[1]
  const total_audience_size = email_array.length + maid_array.length

  const cleaned_schema = cleanSchema(schema_columns, email_array, maid_array, email_schema_name, maid_schema_name)
  const cleaned_payload = cleanPayload(user_payload, email_array, maid_array)

  if (user_payload.length > 0) {
    let res
    const audienceValues = {
      action_type: action,
      column_order: cleaned_schema,
      user_data: cleaned_payload
    }

    if (total_audience_size <= max_size) {
      res = await updateAudience(request, audienceValues, payload[0])
    }

    else {
      res = await updateAudience(request, audienceValues, payload[0])
    }
  }

  else {
    throw new PayloadValidationError('At least one of Email Id or Advertising ID must be provided.')
  }

}


function cleanPayload(user_payloads: string[][], emails: string[], maids: string[]): string[][] {
  let final_payload: string[][] = user_payloads

  if (emails.length === 0 || emails === undefined || emails === null) {
    final_payload[0] = maids
    final_payload[1] = emails
  }
  if (maids.length === 0 || maids === undefined || maids === null) {
    final_payload[0] = emails
    final_payload[1] = maids

  }

  final_payload = final_payload.filter(arr => arr.length > 0);

  return final_payload
}

function cleanSchema(columns: string[], emails: string[], maids: string[],
  email_schema_name: string, maid_schema_name: string): string[] | undefined {
  if (emails.length === 0 || emails === undefined || emails === null) {
    return [maid_schema_name]
  }
  if (maids.length === 0 || maids === undefined || maids === null) {
    return [email_schema_name]
  }
  else {
    return columns
  }
}


async function updateAudience(request: RequestClient, data: {}, payload: AddToAudiencePayload) {
  const updateAudienceUrl = `https://ads-api.reddit.com/api/v3/custom_audiences/${payload.audience_id}/users`
  const json_payload = {
    data
  }
  console.log('data', data)

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
  const audience_payload: string[][] = []
  let user_email: string[] = []
  let user_maid: string[] = []

  payloads.forEach((payload: AddToAudiencePayload) => {
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

function checkHash(value: any): boolean {
  const sha256HashedRegex = /^[a-f0-9]{64}$/i
  return sha256HashedRegex.test(value)
}

function hashEmail(value: any): string {
  const email = normalizeEmail(value)
  const hash = createHash('sha256')

  hash.update(email)
  const hashed_email = hash.digest('hex')

  return hashed_email
}

function sha256Hash(maid: any): string {
  const hash = createHash('sha256')
  hash.update(maid)
  const hashed_maid = hash.digest('hex')

  return hashed_maid
}

function normalizeEmail(value: string): string {
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


function clean(str: string | undefined): string | undefined {
  if (str === undefined || str === null || str === '') return undefined
  return str.trim()
}

export async function createAudience(request: RequestClient, payload: CreateAudiencePayload) {
  console.log('create audience')
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
