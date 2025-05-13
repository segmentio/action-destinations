import type { ActionDefinition, StatsContext } from '@segment/actions-core'
import { RequestClient, RetryableError, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LinkedInAudiences } from '../api'
import { LinkedInAudiencePayload } from '../types'
import { processHashing } from '../../../lib/hashing-utils'

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
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      },
      category: 'hashedPII'
    },
    first_name: {
      label: 'User First Name',
      description: "The user's first name to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.traits.firstName'
      }
    },
    last_name: {
      label: 'User Last Name',
      description: "The user's last name to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.traits.lastName'
      }
    },
    title: {
      label: 'User Title',
      description: "The user's title to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.traits.title'
      }
    },
    company: {
      label: 'User Company',
      description: "The user's company to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.traits.company'
      }
    },
    country: {
      label: 'User Country',
      description:
        "The user's country to send to LinkedIn. This field accepts an ISO standardized two letter country code e.g. US.",
      type: 'string',
      default: {
        '@path': '$.traits.country'
      }
    },
    google_advertising_id: {
      label: 'User Google Advertising ID',
      description: "The user's Google Advertising ID to send to LinkedIn.",
      type: 'string',
      unsafe_hidden: true, // This field is hidden from customers because the desired value always appears at path '$.context.device.advertisingId' in Personas events.
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    source_segment_id: {
      label: 'LinkedIn Source Segment ID',
      description:
        "A Segment-specific key associated with the LinkedIn DMP Segment. This is the lookup key Segment uses to fetch the DMP Segment from LinkedIn's API.",
      type: 'string',
      unsafe_hidden: true, // This field is hidden from customers because the desired value always appears at '$.properties.audience_key' in Personas events.
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
      type: 'string',
      unsafe_hidden: true, // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
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
  perform: async (request, { settings, payload, statsContext }) => {
    return processPayload(request, settings, [payload], statsContext)
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    return processPayload(request, settings, payload, statsContext)
  }
}

async function processPayload(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  statsContext: StatsContext | undefined
) {
  validate(settings, payloads)

  const linkedinApiClient: LinkedInAudiences = new LinkedInAudiences(request)

  const dmpSegmentId = await getDmpSegmentId(linkedinApiClient, settings, payloads[0], statsContext)
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

  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...statsContext?.tags,
    `endpoint:add-or-remove-users-from-dmpSegment`
  ])

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
  const isAutoOrUndefined = ['AUTO', undefined].includes(payloads[0]?.dmp_user_action)
  if (isAutoOrUndefined && payloads[0].source_segment_id !== payloads[0].personas_audience_key) {
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

async function getDmpSegmentId(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  payload: Payload,
  statsContext: StatsContext | undefined
): Promise<string> {
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:get-dmpSegment`])
  const res = await linkedinApiClient.getDmpSegment(settings, payload)
  const body = await res.json()

  if (body.elements?.length > 0) {
    return body.elements[0].id
  }

  return createDmpSegment(linkedinApiClient, settings, payload, statsContext)
}

async function createDmpSegment(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  payload: Payload,
  statsContext: StatsContext | undefined
): Promise<string> {
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:create-dmpSegment`])
  const res = await linkedinApiClient.createDmpSegment(settings, payload)
  const headers = res.headers.toJSON()
  return headers['x-linkedin-id']
}

function extractUsers(settings: Settings, payloads: Payload[]): LinkedInAudiencePayload[] {
  const elements: LinkedInAudiencePayload[] = []

  payloads.forEach((payload: Payload) => {
    if (!payload.email && !payload.google_advertising_id) {
      return
    }

    const linkedinAudiencePayload: LinkedInAudiencePayload = {
      action: getAction(payload),
      userIds: getUserIds(settings, payload)
    }

    if (payload.first_name) {
      linkedinAudiencePayload.firstName = payload.first_name
    }

    if (payload.last_name) {
      linkedinAudiencePayload.lastName = payload.last_name
    }

    if (payload.title) {
      linkedinAudiencePayload.title = payload.title
    }

    if (payload.company) {
      linkedinAudiencePayload.company = payload.company
    }

    if (payload.country) {
      linkedinAudiencePayload.country = payload.country
    }

    elements.push(linkedinAudiencePayload)
  })

  return elements
}

function getAction(payload: Payload): 'ADD' | 'REMOVE' {
  const { dmp_user_action = 'AUTO' } = payload

  if (dmp_user_action === 'ADD') {
    return 'ADD'
  }

  if (dmp_user_action === 'REMOVE') {
    return 'REMOVE'
  }

  if (dmp_user_action === 'AUTO' || !dmp_user_action) {
    if (payload.event_name === 'Audience Entered') {
      return 'ADD'
    }

    if (payload.event_name === 'Audience Exited') {
      return 'REMOVE'
    }
  }

  return 'ADD'
}

function getUserIds(settings: Settings, payload: Payload): Record<string, string>[] {
  const userIds = []

  if (payload.email && settings.send_email === true) {
    userIds.push({
      idType: 'SHA256_EMAIL',
      idValue: processHashing(payload.email, 'sha256', 'hex')
    })
  }

  if (payload.google_advertising_id && settings.send_google_advertising_id === true) {
    userIds.push({
      idType: 'GOOGLE_AID',
      idValue: payload.google_advertising_id
    })
  }

  return userIds
}

export default action
