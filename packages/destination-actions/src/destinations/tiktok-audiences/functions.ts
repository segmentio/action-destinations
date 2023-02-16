import { IntegrationError, RequestClient, RetryableError } from '@segment/actions-core'
import { Audiences } from './types'
import { createHash } from 'crypto'
import { TikTokAudiences } from './api'
import { Payload as AddUserPayload } from './addUser/generated-types'
import { Payload as RemoveUserPayload } from './removeUser/generated-types'

type GenericPayload = AddUserPayload | RemoveUserPayload

export async function processPayload(request: RequestClient, settings: Settings, payloads: Payload[], action: string) {
  validate(payloads)
  const TikTokApiClient: TikTokAudiences = new TikTokAudiences(request)

  const audiences = await getAllAudiences(TikTokApiClient, settings)

  const audience_id = await getAudienceID(TikTokApiClient, settings, payloads[0], audiences)

  const users = extractUsers(payloads, audience_id)

  let res
  if (users.length > 0) {
    const elements = {
      advertiser_ids: [settings.advertiser_id],
      action: action,
      data: users
    }
    res = await TikTokApiClient.batchUpdate(elements)

    // At this point, if TikTok's API returns a 400 error, it's because the audience
    // Segment just created isn't available yet for updates via this endpoint.
    // Audiences are usually available to accept batches of data 1 - 2 minutes after
    // they're created. Here, we'll throw an error and let Centrifuge handle the retry.
    if (res.status !== 200) {
      throw new RetryableError('Error while attempting to update TikTok Audience. This batch will be retried.')
    }
  }

  return res
}

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
export async function getAllAudiences(TikTokApiClient: TikTokAudiences) {
  let response = await TikTokApiClient.getAudiences(1, 100)
  let audiences: Audiences[] = response.data.data.list
  const total_number_audiences = response.data.data.page_info.total_number
  let recieved_audiences = 100
  let page_number = 2
  while (recieved_audiences < total_number_audiences) {
    response = await TikTokApiClient.getAudiences(page_number, 100)
    audiences = audiences.concat(response.data.data.list)
    page_number += 1
    recieved_audiences += 100
  }
  return audiences
}

export async function getAudienceID(
  TikTokApiClient: TikTokAudiences,
  payload: GenericPayload,
  audiences: Audiences[]
): Promise<string> {
  let audienceID
  const audienceExists = audiences.filter(function (audience) {
    if (audience.name === payload.custom_audience_name) {
      return audience.audience_id
    }
  })

  // More than 1 audience returned matches name
  if (audienceExists.length > 1) {
    throw new IntegrationError('Multiple audiences found with the same name', 'INVALID_SETTINGS', 400)
  }

  if (audienceExists.length == 1) {
    audienceID = audienceExists[0].audience_id
  } else {
    const response = await TikTokApiClient.createAudience(payload as AddUserPayload)
    audienceID = response.data.data.audience_id
  }

  return audienceID
}

export function extractUsers(payloads: GenericPayload[], audienceID: string): {}[] {
  const data: {}[] = []

  payloads.forEach((payload: Payload) => {
    if (!payload.email && !payload.advertising_id && !payload.phone) {
      return
    }

    let id
    if (payload.id_type == 'EMAIL_SHA256' && payload.email) {
      // Email specific normalization
      payload.email = payload.email.replace(/\+.*@/, '@').replace(/\./g, '').toLowerCase()
      id = createHash('sha256').update(payload.email).digest('hex')
    } else if (payload.id_type == ('AAID_SHA256' || 'GAID_SHA256' || 'IDFA_SHA256') && payload.advertising_id) {
      id = createHash('sha256').update(payload.advertising_id).digest('hex')
    } else if (payload.id_type == 'PHONE_SHA256' && payload.phone) {
      id = createHash('sha256').update(payload.phone).digest('hex')
    }

    data.push({
      id_type: payload.id_type,
      id: id,
      audience_ids: [audienceID]
    })
  })
  return data
}
