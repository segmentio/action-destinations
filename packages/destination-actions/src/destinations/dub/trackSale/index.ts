import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../config'
import { DubTrackSalePayload } from '../trackLead/types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track a Sale',
  description: 'Track a Sale for a Short Link',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
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
      description: 'The amount of the Sale.',
      type: 'number',
      required: true,
      default: {
        '@path': '$.properties.revenue'
      }
    },
    paymentProcessor: {
      label: 'Payment Processor',
      description: 'The payment processor via which the Sale was made.',
      type: 'string',
      required: true
    },
    eventName: {
      label: 'Event Name',
      description:
        'The name of the Sale event. It can be used to track different types of event for example "Purchase", "Upgrade", "Payment", etc.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.event'
      }
    },
    leadEventName: {
      label: 'Lead Event Name',
      description:
        'The name of the Lead event that occurred before the Sale (case-sensitive). This is used to associate the Sale event with a particular Lead event (instead of the latest Lead event, which is the default behavior).',
      type: 'string',
      required: false
    },
    invoiceId: {
      label: 'Invoice ID',
      description:
        'The invoice ID of the Sale. Can be used as a idempotency key – only one Sale event can be recorded for a given invoice ID.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.order_id'
      }
    },
    currency: {
      label: 'Currency',
      description: 'The currency of the Sale. Accepts ISO 4217 currency codes.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.currency'
      }
    },
    metadata: {
      label: 'Metadata',
      description: 'Additional metadata to be stored with the Sale event.',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties.products'
      }
    }
  },
  perform: (request, { payload }) => {
    return request(`${API_URL}/track/sale`, {
      method: 'POST',
      json: payload as DubTrackSalePayload
    })
  }
}

export default action
