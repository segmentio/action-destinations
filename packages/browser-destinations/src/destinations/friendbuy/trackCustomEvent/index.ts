import type { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonCustomerAttributes } from '../commonFields'
import { createFriendbuyPayload, filterFriendbuyAttributes } from '../util'

// https://segment.com/docs/connections/spec/ecommerce/v2/#order-completed
export const trackCustomEventFields: Record<string, InputField> = {
  eventName: {
    type: 'string',
    required: true,
    description: 'The name of the event to track.',
    label: 'Event Name',
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

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Custom Event',
  description: 'Record when a customer completes any custom event.',
  // trackCustomEvent has no default subscription.
  platform: 'web',
  fields: trackCustomEventFields,

  perform: (friendbuyAPI, data) => {
    const [nonCustomerPayload, customerAttributes] = commonCustomerAttributes({
      customerId: data.payload.customerId,
      anonymousId: data.payload.anonymousId,
      ...data.payload.eventProperties});

    const friendbuyPayload = createFriendbuyPayload(
      [
        ...filterFriendbuyAttributes(nonCustomerPayload),
        ['deduplicationId', data.payload.deduplicationId],
        ['customer', createFriendbuyPayload(customerAttributes)],
      ],
      { dropEmpty: true }
    )
    friendbuyAPI.push(['track', data.payload.eventName, friendbuyPayload])
  }
}

export default action
