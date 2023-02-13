import type { ActionDefinition } from '@segment/actions-core'
import { RequestClient, IntegrationError } from '@segment/actions-core'
import { TikTokAudiences } from '../api'
import type { Settings } from '../generated-types'
import { Audiences } from '../types'
import type { Payload } from './generated-types'
import { createHash } from 'crypto'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Audience',
  description: 'Sync contacts from an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    custom_audience_name: {
      label: 'Custom Audience Name',
      description:
        'Custom audience name of audience to be created. Please note that names over 70 characters will be truncated to 67 characters with "..." appended. This field is set only when Segment creates a new audience. Updating this field after Segment has created an audience will not update the audience name in TikTok.',
      type: 'string',
      default: {
        '@path': '$.properties.audience_key'
      }
    },
    id_type: {
      label: 'ID Type',
      description: 'Encryption type to be used for populating the audience.',
      type: 'string',
      choices: [
        { label: 'Email', value: 'EMAIL_SHA256' },
        { label: 'Google Advertising ID', value: 'GAID_SHA256' }
      ]
    },
    email: {
      label: 'User Email',
      description: "The user's email address to send to LinkedIn.",
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.traits.email' in Personas events.
      default: {
        '@path': '$.context.traits.email'
      }
    },
    google_advertising_id: {
      label: 'User Google Advertising ID',
      description: "The user's Google Advertising ID to send to LinkedIn.",
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.device.advertisingId' in Personas events.
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
      default: {
        '@path': '$.event'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to the TikTok Audiences.',
      type: 'boolean',
      default: true
    },
    personas_audience_key: {
      label: 'Segment Engage Audience Key',
      description:
        'The `audience_key` of the Engage audience you want to sync to TikTok. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
      type: 'string'
    }
  },
  perform: async (request, { settings, payload }) => {
    return processPayload(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
}

async function processPayload(request: RequestClient, settings: Settings, payloads: Payload[]) {
  validate(payloads)
  const TikTokApiClient: TikTokAudiences = new TikTokAudiences(request)

  const audiences = await getAllAudiences(TikTokApiClient, settings)

  const audience_id = await getAudienceID(TikTokApiClient, settings, payloads[0], audiences)

  const users = extractUsers(payloads, audience_id)

  let res
  if (users.length > 0) {
    const elements = {
      advertiser_ids: [settings.advertiser_id],
      action: 'add',
      data: users
    }
    res = await TikTokApiClient.batchUpdate(elements)
  }

  return res
}

function validate(payloads: Payload[]): void {
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
async function getAllAudiences(TikTokApiClient: TikTokAudiences, settings: Settings) {
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

async function getAudienceID(
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

  if (audienceExists.length > 0) {
    audienceID = audienceExists[0].audience_id
  } else {
    const response = await TikTokApiClient.createAudience(settings, payload)
    audienceID = response.data.data.audience_id
  }

  return audienceID
}

function getAction(payload: Payload) {
  if (payload.event_name === 'Audience Entered') {
    return 'add'
  } else if (payload.event_name === 'Audience Exited') {
    return 'delete'
  }
}

function extractUsers(payloads: Payload[], audienceID: string): {}[] {
  const data: {}[] = []

  payloads.forEach((payload: Payload) => {
    if (!payload.email && !payload.google_advertising_id) {
      return
    }

    const payloadAction = getAction(payload)

    if (payloadAction === 'add') {
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

export default action
