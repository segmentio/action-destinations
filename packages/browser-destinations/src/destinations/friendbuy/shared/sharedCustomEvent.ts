import type { InputField } from '@segment/actions-core'

export const trackCustomEventFields: Record<string, InputField> = {
  eventType: {
    type: 'string',
    required: true,
    description: 'The type of the event to track.',
    label: 'Event Type',
    default: { '@path': '$.event' }
  },
  eventProperties: {
    type: 'object',
    required: true,
    description:
      'Object containing the properties for the event being tracked. All of the fields in this object will be sent in the root of the Friendbuy track event.',
    label: 'Event Properties',
    default: { '@path': '$.properties' }
  },
  deduplicationId: {
    type: 'string',
    required: false,
    description:
      'An identifier for the event being tracked to prevent the same event from being rewarded more than once.',
    label: 'Event ID',
    default: { '@path': '$.properties.deduplicationId' }
  },
  customerId: {
    label: 'Customer ID',
    description: "The user's customerId.",
    type: 'string',
    required: true,
    default: { '@path': '$.userId' }
  },
  anonymousId: {
    label: 'Anonymous ID',
    description: "The user's anonymous id",
    type: 'string',
    required: false,
    default: { '@path': '$.anonymousId' }
  }
}
