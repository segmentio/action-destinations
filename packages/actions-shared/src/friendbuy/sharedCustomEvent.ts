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
    description: "The user's customer ID.",
    type: 'string',
    required: true,
    default: {
      // We hope that we have a userId because analytics.identify has been
      // called but, if not, allow a customerId to be specified in the
      // event.  If one is specified, it overrides the one from the identify
      // call.
      '@if': {
        exists: { '@path': '$.properties.customerId' },
        then: { '@path': '$.properties.customerId' },
        else: { '@path': '$.userId' }
      }
    }
  },
  anonymousId: {
    label: 'Anonymous ID',
    description: "The user's anonymous id",
    type: 'string',
    required: false,
    default: { '@path': '$.anonymousId' }
  },
  email: {
    label: 'Email',
    description: "The user's email address.",
    type: 'string',
    required: true,
    default: { '@path': '$.properties.email' }
  }
}
