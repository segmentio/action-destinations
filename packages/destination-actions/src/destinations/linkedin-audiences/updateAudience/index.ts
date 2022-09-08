import type { ActionDefinition } from '@segment/actions-core'
import type { RequestClient } from '@segment/actions-core'
import { RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createHash } from 'crypto'
import { IntegrationError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP Segment',
  description: 'Syncs contacts from a Personas Audience to a LinkedIn DMP Segment.',
  fields: {
    dmp_segment_name: {
      label: 'DMP Segment Display Name',
      description: 'The display name of the LinkedIn DMP Segment.',
      type: 'string',
      default: {
        '@path': '$.properties.audience_key'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to the LinkedIn DMP Segment.',
      type: 'hidden',
      default: true
    },
    email: {
      label: 'User Email',
      description: "The user's email address to send to LinkedIn.",
      type: 'hidden',
      default: {
        '@path': '$.context.traits.email'
      }
    },
    send_email: {
      label: 'Send Email',
      description: 'Whether to send `email` to LinkedIn.',
      type: 'boolean',
      default: true
    },
    google_advertising_id: {
      label: 'User Google Advertising ID',
      description: "The user's Google Advertising ID to send to LinkedIn.",
      type: 'hidden',
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    send_google_advertising_id: {
      label: 'Send Google Advertising ID',
      description: 'Whether to send Google Advertising ID to LinkedIn.',
      type: 'boolean',
      default: true
    },
    source_segment_id: {
      label: 'LinkedIn Source Segment ID',
      description:
        "A Segment-specific key associated with the LinkedIn DMP Segment. This is the lookup key Segment uses to fetch the DMP Segment from LinkedIn's API.",
      type: 'hidden',
      default: {
        '@path': '$.properties.audience_key'
      }
    },
    personas_audience_key: {
      label: 'Segment Personas Audience Key',
      description:
        'The `audience_key` of the Personas audience you want to sync to LinkedIn. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
      type: 'string',
      required: true
    },
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'hidden',
      default: {
        '@path': '$.event'
      }
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
  if (payloads[0].source_segment_id !== payloads[0].personas_audience_key) {
    throw new IntegrationError(
      'The value of `source_segment_id` and `personas_audience_key` must match.',
      'Invalid settings.',
      400
    )
  }

  const dmpSegmentId = await getDmpSegmentId(request, settings, payloads[0])
  const elements = extractUsers(payloads)
  return request(`https://api.linkedin.com/rest/dmpSegments/${dmpSegmentId}/users`, {
    method: 'POST',
    headers: {
      'X-RestLi-Method': 'BATCH_CREATE'
    },
    json: {
      elements
    }
  })
}

async function getDmpSegmentId(request: RequestClient, settings: Settings, payload: Payload) {
  const res = await getDmpSegment(request, settings, payload)
  const body = await res.json()

  if (body.elements?.length > 0) {
    return body.elements[0].id
  }

  return createDmpSegment(request, settings, payload)
}

async function getDmpSegment(request: RequestClient, settings: Settings, payload: Payload) {
  return request(
    `https://api.linkedin.com/rest/dmpSegments?q=account&account=urn:li:sponsoredAccount:${settings.ad_account_id}&sourceSegmentId=${payload.source_segment_id}&sourcePlatform=SEGMENT`
  )
}

async function createDmpSegment(request: RequestClient, settings: Settings, payload: Payload) {
  await request('https://api.linkedin.com/rest/dmpSegments', {
    method: 'POST',
    json: {
      name: payload.dmp_segment_name,
      sourcePlatform: 'SEGMENT',
      sourceSegmentId: payload.source_segment_id,
      account: `urn:li:sponsoredAccount:${settings.ad_account_id}`,
      accessPolicy: 'PRIVATE',
      type: 'USER',
      destinations: [
        {
          destination: 'LINKEDIN'
        }
      ]
    }
  })

  const res = await getDmpSegment(request, settings, payload)
  const body = await res.json()

  if (body.elements?.length > 0) {
    return body.elements[0].id
  }

  throw new RetryableError('Failed to fetch or create a LinkedIn DMP Segment.')
}

function extractUsers(payloads: Payload[]) {
  const elements: Record<string, any>[] = []

  payloads.forEach((payload: Payload) => {
    if (!payload.email && !payload.google_advertising_id) {
      return
    }

    elements.push({
      action: getAction(payload),
      userIds: getUserIds(payload)
    })
  })

  return elements
}

function getAction(payload: Payload) {
  if (payload.event_name === 'Audience Entered') {
    return 'ADD'
  } else if (payload.event_name === 'Audience Exited') {
    return 'REMOVE'
  }
}

function getUserIds(payload: Payload): Record<string, string>[] {
  const users = []

  if (payload.email) {
    users.push({
      idType: 'SHA256_EMAIL',
      idValue: createHash('sha256').update(payload.email).digest('hex')
    })
  }

  if (payload.google_advertising_id) {
    users.push({
      idType: 'GOOGLE_AID',
      idValue: payload.google_advertising_id
    })
  }

  return users
}

export default action
