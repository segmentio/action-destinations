import { IntegrationError } from '@segment/actions-core'
import { Audiences } from './types'
import { createHash } from 'crypto'
import { TikTokAudiences } from './api'
import type { Settings } from './generated-types'
import { Payload } from './addUser/generated-types'

export function validate(payloads: Payload[]): void {
  if (payloads[0].custom_audience_name !== payloads[0].personas_audience_key) {
    throw new IntegrationError(
      'The value of `custom_audience_name` and `personas_audience_key` must match.',
      'INVALID_SETTINGS',
      400
    )
  }
}

// TikTok returns a max of 100 audiences per request to their `list` endpoint.
// A customer can have a max of 400 audiences in a single advertiser account.
// We may have to make up to 4 requests to get all audiences.
// The first request will return the total_number of audiences associated with
// the advertiser account.
export async function getAllAudiences(TikTokApiClient: TikTokAudiences, settings: Settings) {
  let response = await TikTokApiClient.getAudiences(settings, 1, 100)
  let audiences: Audiences[] = response.data.data.list
  const total_number_audiences = response.data.data.page_info.total_number
  let recieved_audiences = 100
  let page_number = 2
  while (recieved_audiences < total_number_audiences) {
    response = await TikTokApiClient.getAudiences(settings, page_number, 100)
    audiences = audiences.concat(response.data.data.list)
    page_number += 1
    recieved_audiences += 100
  }
  return audiences
}

export async function getAudienceID(
  TikTokApiClient: TikTokAudiences,
  settings: Settings,
  payload: Payload,
  audiences: Audiences[]
): Promise<string> {
  let audienceID
  const audienceExists = audiences.filter(function (audience) {
    if (audience.name === payload.custom_audience_name) {
      return audience.audience_id
    }
  })

  // More than 1 audience returned matches name
  // TODO: add field so the user can add the audienceID so we can choose based on that
  if (audienceExists.length > 1) {
    throw new IntegrationError('Multiple audiences found with the same name', 'INVALID_SETTINGS', 400)
  }

  if (audienceExists.length == 1) {
    audienceID = audienceExists[0].audience_id
  } else {
    const response = await TikTokApiClient.createAudience(settings, payload)
    audienceID = response.data.data.audience_id
  }

  return audienceID
}

export function extractUsers(payloads: Payload[], audienceID: string): {}[] {
  const data: {}[] = []

  payloads.forEach((payload: Payload) => {
    if (!payload.email && !payload.google_advertising_id) {
      return
    }

    if (payload.id_type == 'EMAIL_SHA256' && payload.email) {
      // Email specific normalization
      payload.email = payload.email.replace(/\+.*@/, '@').replace(/\./g, '').toLowerCase()
      data.push({
        id_type: 'EMAIL_SHA256',
        id: createHash('sha256').update(payload.email).digest('hex'),
        audience_ids: [audienceID]
      })
    }

    if (payload.id_type == 'GAID_SHA256' && payload.google_advertising_id) {
      data.push({
        id_type: 'GAID_SHA256',
        id: createHash('sha256').update(payload.google_advertising_id).digest('hex'),
        audience_ids: [audienceID]
      })
    }
  })
  return data
}
