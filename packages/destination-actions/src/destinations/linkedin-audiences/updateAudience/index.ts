import type { ActionDefinition } from '@segment/actions-core'
import { RequestClient, RetryableError, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createHash } from 'crypto'
import { LinkedInAudiences } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP Segment',
  description: 'Syncs contacts from a Personas Audience to a LinkedIn DMP Segment.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    dmp_segment_name: {
      label: 'DMP Segment Display Name',
      description:
        'The display name of the LinkedIn DMP Segment. This field is set only when Segment creates a new audience. Updating this field after Segment has created an audience will not update the audience name in LinkedIn.',
      type: 'string',
      default: {
        '@path': '$.properties.audience_key'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to the LinkedIn DMP Segment.',
      type: 'boolean',
      default: true
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
    source_segment_id: {
      label: 'LinkedIn Source Segment ID',
      description:
        "A Segment-specific key associated with the LinkedIn DMP Segment. This is the lookup key Segment uses to fetch the DMP Segment from LinkedIn's API.",
      type: 'hidden', // This field is hidden from customers because the desired value always appears at '$.properties.audience_key' in Personas events.
      default: {
        '@path': '$.properties.audience_key'
      }
    },
    personas_audience_key: {
      label: 'Segment Engage Audience Key',
      description:
        'The `audience_key` of the Engage audience you want to sync to LinkedIn. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
      type: 'string',
      required: true
    },
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
      default: {
        '@path': '$.event'
      }
    },
    dmp_user_action: {
      label: 'DMP User Action',
      description: 'A Segment specific key used to define action type.',
      type: 'string',
      choices: [
        { label: `Auto Detect`, value: 'AUTO' },
        { label: `Add`, value: 'ADD' },
        { label: 'Remove', value: 'REMOVE' }
      ],
      default: 'AUTO'
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
  validate(settings, payloads)

  const linkedinApiClient: LinkedInAudiences = new LinkedInAudiences(request)

  const dmpSegmentId = await getDmpSegmentId(linkedinApiClient, settings, payloads[0])
  const elements = extractUsers(settings, payloads)

  // We should never hit this condition because at least an email or a
  // google ad id is required in each payload, but if we do, returning early
  // rather than hitting LinkedIn's API (with no data) is more efficient.
  // The monoservice will interpret this early return as a 200.
  // If we were to send an empty elements array to LINKEDIN_API_VERSION,
  // their API would also respond with status 200.
  if (elements.length < 1) {
    return
  }

  const res = await linkedinApiClient.batchUpdate(dmpSegmentId, elements)

  // At this point, if LinkedIn's API returns a 404 error, it's because the audience
  // Segment just created isn't available yet for updates via this endpoint.
  // Audiences are usually available to accept batches of data 1 - 2 minutes after
  // they're created. Here, we'll throw an error and let Centrifuge handle the retry.
  if (res.status !== 200) {
    throw new RetryableError('Error while attempting to update LinkedIn DMP Segment. This batch will be retried.')
  }

  return res
}

function validate(settings: Settings, payloads: Payload[]): void {
  if (payloads[0]?.dmp_user_action === 'AUTO' && payloads[0].source_segment_id !== payloads[0].personas_audience_key) {
    throw new IntegrationError(
      'The value of `source_segment_id` and `personas_audience_key` must match.',
      'INVALID_SETTINGS',
      400
    )
  }

  if (!settings.send_google_advertising_id && !settings.send_email) {
    throw new IntegrationError(
      'At least one of `Send Email` or `Send Google Advertising ID` must be set to `true`.',
      'INVALID_SETTINGS',
      400
    )
  }
}

async function getDmpSegmentId(linkedinApiClient: LinkedInAudiences, settings: Settings, payload: Payload) {
  const res = await linkedinApiClient.getDmpSegment(settings, payload)
  const body = await res.json()

  if (body.elements?.length > 0) {
    return body.elements[0].id
  }

  return createDmpSegment(linkedinApiClient, settings, payload)
}

async function createDmpSegment(linkedinApiClient: LinkedInAudiences, settings: Settings, payload: Payload) {
  const res = await linkedinApiClient.createDmpSegment(settings, payload)
  const headers = res.headers.toJSON()
  return headers['x-linkedin-id']
}

function extractUsers(settings: Settings, payloads: Payload[]) {
  const elements: Record<string, any>[] = []

  payloads.forEach((payload: Payload) => {
    if (!payload.email && !payload.google_advertising_id) {
      return
    }

    elements.push({
      action: getAction(payload),
      userIds: getUserIds(settings, payload)
    })
  })

  return elements
}

function getAction(payload: Payload) {
  const { dmp_user_action = 'AUTO' } = payload

  if (dmp_user_action === 'ADD') {
    return 'ADD'
  } else if (dmp_user_action === 'REMOVE') {
    return 'REMOVE'
  } else if (dmp_user_action === 'AUTO' || !dmp_user_action) {
    if (payload.event_name === 'Audience Entered') {
      return 'ADD'
    } else if (payload.event_name === 'Audience Exited') {
      return 'REMOVE'
    }
  }
}

function getUserIds(settings: Settings, payload: Payload): Record<string, string>[] {
  const users = []

  if (payload.email && settings.send_email === true) {
    users.push({
      idType: 'SHA256_EMAIL',
      idValue: createHash('sha256').update(payload.email).digest('hex')
    })
  }

  if (payload.google_advertising_id && settings.send_google_advertising_id === true) {
    users.push({
      idType: 'GOOGLE_AID',
      idValue: payload.google_advertising_id
    })
  }

  return users
}

export default action
