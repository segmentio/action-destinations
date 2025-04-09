import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../config'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track a sale',
  description: 'Track a sale for a short link',
  defaultSubscription: 'type = "track"',
  fields: {
    externalId: {
      label: 'External ID',
      description:
        "This is the unique identifier for the customer in the your app. This is used to track the customer's journey.",
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    amount: {
      label: 'Amount',
      description: 'The amount of the sale.',
      type: 'number',
      required: true
    },
    paymentProcessor: {
      label: 'Payment Processor',
      description: 'The payment processor via which the sale was made.',
      type: 'string',
      required: true
    },
    eventName: {
      label: 'Event Name',
      description:
        'The name of the sale event. It can be used to track different types of event for example "Purchase", "Upgrade", "Payment", etc.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.event'
      }
    },
    leadEventName: {
      label: 'Lead Event Name',
      description:
        'The name of the lead event that occurred before the sale (case-sensitive). This is used to associate the sale event with a particular lead event (instead of the latest lead event, which is the default behavior).',
      type: 'string',
      required: false
    },
    invoiceId: {
      label: 'Invoice ID',
      description:
        'The invoice ID of the sale. Can be used as a idempotency key – only one sale event can be recorded for a given invoice ID.',
      type: 'string',
      required: false
    },
    currency: {
      label: 'Currency',
      description: 'The currency of the sale. Accepts ISO 4217 currency codes.',
      type: 'string',
      required: false
    },
    metadata: {
      label: 'Metadata',
      description: 'Additional metadata to be stored with the sale event.',
      type: 'object',
      required: false
    }
  },
  perform: (request, { payload }) => {
    return request(`${API_URL}/track/sale`, {
      method: 'POST',
      json: payload
    })
  },
  performBatch: async (request, { payload }) => {
    return await Promise.all(
      payload.map(async (event) =>
        request(`${API_URL}/track/sale`, {
          method: 'POST',
          json: event
        })
      )
    )
  }
}

export default action
