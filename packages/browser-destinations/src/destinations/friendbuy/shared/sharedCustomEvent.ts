import type { InputField } from '@segment/actions-core'

import { commonCustomerAttributes } from './commonFields'
import { createFriendbuyPayload, filterFriendbuyAttributes } from './util'

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
      'Hash of other properties for the event being tracked. All of the fields in this object will be sent in the root of the Friendbuy track event.',
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

export interface AnalyticsCustomEventPayload {
  eventName: string
  eventProperties: { [k: string]: unknown }
  deduplicationId?: string
  customerId: string
  anonymousId?: string
}

export function createCustomEventPayload(analyticsPayload: AnalyticsCustomEventPayload) {
  const [nonCustomerPayload, customerAttributes] = commonCustomerAttributes({
    customerId: analyticsPayload.customerId,
    anonymousId: analyticsPayload.anonymousId,
    ...analyticsPayload.eventProperties
  })

  const friendbuyPayload = createFriendbuyPayload(
    [
      ...filterFriendbuyAttributes(nonCustomerPayload),
      ['deduplicationId', analyticsPayload.deduplicationId],
      ['customer', createFriendbuyPayload(customerAttributes)]
    ],
    { dropEmpty: true }
  )

  return friendbuyPayload
}
