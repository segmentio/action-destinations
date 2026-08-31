import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MAX_EVENTS_PER_REQUEST, sendEvents } from '../api'

const EVENT_CATEGORIES = ['feature_usage', 'navigation', 'api', 'billing', 'support', 'auth', 'integration', 'admin']

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send a product usage event to GainTrace. Events drive feature adoption, engagement and account health.',
  defaultSubscription: 'type = "track"',
  fields: {
    messageId: {
      label: 'Message ID',
      description:
        "Segment's unique message ID. GainTrace stores it as the event's deduplication key, so redelivered or replayed events are counted once.",
      type: 'string',
      required: true,
      default: { '@path': '$.messageId' }
    },
    eventName: {
      label: 'Event Name',
      description: 'The name of the event, for example "Report Exported".',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    timestamp: {
      label: 'Timestamp',
      description:
        'When the event occurred, as an ISO-8601 timestamp. GainTrace stores this rather than the time of receipt, so historical replays land on the correct dates.',
      type: 'datetime',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    userId: {
      label: 'User ID',
      description:
        'The identifier for the person who performed the event. Matched against a GainTrace person by external ID or email. Required unless an Anonymous ID is provided.',
      type: 'string',
      // An event needs at least one identifier or it cannot be attributed to a
      // person or a company. Expressed conditionally so the mapping UI catches
      // it while the customer is configuring, rather than at delivery time.
      required: {
        conditions: [{ fieldKey: 'anonymousId', operator: 'is', value: undefined }]
      },
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description:
        'The anonymous identifier for the visitor, used when no User ID is known yet. Required unless a User ID is provided.',
      type: 'string',
      required: {
        conditions: [{ fieldKey: 'userId', operator: 'is', value: undefined }]
      },
      default: { '@path': '$.anonymousId' }
    },
    eventCategory: {
      label: 'Event Category',
      description: 'How GainTrace should classify the event.',
      type: 'string',
      choices: EVENT_CATEGORIES.map((value) => ({ label: value, value })),
      default: 'feature_usage'
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties to store alongside the event.',
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.properties' }
    },
    enable_batching: {
      label: 'Batch Data to GainTrace',
      description:
        'If true, Segment sends events to GainTrace in batches. GainTrace accepts up to 1000 events per request.',
      type: 'boolean',
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: MAX_EVENTS_PER_REQUEST,
      unsafe_hidden: true
    }
  },
  perform: (request, { payload }) => sendEvents(request, [payload], 'feature_usage', false),
  performBatch: (request, { payload }) => sendEvents(request, payload, 'feature_usage', true)
}

export default action
