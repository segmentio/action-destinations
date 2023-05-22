import { IntegrationError, RequestClient, RetryableError } from '@segment/actions-core'
import { createHash } from 'crypto'
import { TikTokAudiences } from './api'
import { Payload as AddUserPayload } from './addUser/generated-types'
import { Payload as RemoveUserPayload } from './removeUser/generated-types'
import { Payload as CreateAudiencePayload } from './createAudience/generated-types'
import { Settings } from './generated-types'
import { Audiences } from './types'

type GenericPayload = AddUserPayload | RemoveUserPayload

export async function processPayload(
  request: RequestClient,
  settings: Settings,
  payloads: GenericPayload[],
  action: string
) {
  validate(payloads)

  const selected_advertiser_id = payloads[0].selected_advertiser_id ?? undefined
  const TikTokApiClient: TikTokAudiences = new TikTokAudiences(request, selected_advertiser_id)

  // Temporary to test creating audiences in sync
  const audiences = await getAllAudiences(TikTokApiClient)
  const audience_id = await getAudienceID(TikTokApiClient, payloads[0], audiences)

  const id_schema = getIDSchema(payloads[0])

  const users = extractUsers(payloads, audience_id)

  let res
  if (users.length > 0) {
    const elements = {
      advertiser_ids: settings.advertiser_ids,
      action: action,
      id_schema: id_schema,
      batch_data: users
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

export async function createAudience(request: RequestClient, payload: CreateAudiencePayload) {
  const selected_advertiser_id = payload.selected_advertiser_id ?? undefined
  const TikTokApiClient: TikTokAudiences = new TikTokAudiences(request, selected_advertiser_id)
  const audiences = await getAllAudiences(TikTokApiClient)
  return await getAudienceID(TikTokApiClient, payload, audiences)
}

// TikTok returns a max of 100 audiences per request to their `list` endpoint.
// A customer can have a max of 400 audiences in a single advertiser account.
// We may have to make up to 4 requests to get all audiences.
// The first request will return the total_number of audiences associated with
// the advertiser account.
export async function getAllAudiences(TikTokApiClient: TikTokAudiences) {
  let response = await TikTokApiClient.getAudiences(1, 100)
  let audiences: Audiences[] = response.data.list
  const total_number_audiences = response.data.page_info.total_number
  let recieved_audiences = response.data.page_info.page_size
  let page_number = 2
  while (recieved_audiences < total_number_audiences) {
    response = await TikTokApiClient.getAudiences(page_number, 100)
    audiences = audiences.concat(response.data.list)
    page_number += 1
    recieved_audiences += response.data.page_info.page_size
  }
  return audiences
}

export async function getAudienceID(
  TikTokApiClient: TikTokAudiences,
  payload: CreateAudiencePayload,
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

export function validate(payloads: GenericPayload[]): void {
  if (payloads[0].send_email === false && payloads[0].send_advertising_id === false) {
    throw new IntegrationError(
      'At least one of `Send Email`, or `Send Advertising ID` must be set to `true`.',
      'INVALID_SETTINGS',
      400
    )
  }
}

export function getIDSchema(payload: GenericPayload): string[] {
  const id_schema = []
  if (payload.send_email === true) {
    id_schema.push('EMAIL_SHA256')
  }
  if (payload.send_advertising_id === true) {
    id_schema.push('IDFA_SHA256')
  }

  return id_schema
}

export function extractUsers(payloads: GenericPayload[], audienceID: string): {}[][] {
  const batch_data: {}[][] = []

  payloads.forEach((payload: GenericPayload) => {
    if (!payload.email && !payload.advertising_id) {
      return
    }

    const user_ids: {}[] = []

    if (payload.send_email === true) {
      let email_id = {}
      if (payload.email) {
        payload.email = payload.email.replace(/\+.*@/, '@').replace(/\./g, '').toLowerCase()
        email_id = {
          id: createHash('sha256').update(payload.email).digest('hex'),
          audience_ids: [audienceID]
        }
      }
      user_ids.push(email_id)
    }

    if (payload.send_advertising_id === true) {
      let advertising_id = {}
      if (payload.advertising_id) {
        advertising_id = {
          id: createHash('sha256').update(payload.advertising_id).digest('hex'),
          audience_ids: [audienceID]
        }
      }
      user_ids.push(advertising_id)
    }

    batch_data.push(user_ids)
  })
  return batch_data
}
