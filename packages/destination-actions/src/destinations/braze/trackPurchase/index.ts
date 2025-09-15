import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendTrackPurchase, sendBatchedTrackPurchase } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Purchase',
  description: 'Record purchases in Braze',
  defaultSubscription: 'event = "Order Completed"',
  fields: {
    external_id: {
      label: 'External User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    user_alias: {
      label: 'User Alias Object',
      description:
        'A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).',
      type: 'object',
      properties: {
        alias_name: {
          label: 'Alias Name',
          type: 'string'
        },
        alias_label: {
          label: 'Alias Label',
          type: 'string'
        }
      }
    },
    email: {
      label: 'Email',
      description: 'The user email',
      type: 'string',
      default: {
        '@path': '$.traits.email'
      }
    },
    braze_id: {
      label: 'Braze User Identifier',
      description: 'The unique user identifier',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.properties.braze_id'
      }
    },
    time: {
      label: 'Time',
      description: 'When the event occurred.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.receivedAt'
      }
    },
    products: {
      label: 'Products',
      description: 'Products purchased',
      type: 'object',
      multiple: true,
      required: true,
      additionalProperties: true,
      properties: {
        product_id: {
          label: 'Product ID',
          type: 'string',
          required: true
        },
        currency: {
          label: 'Currency',
          type: 'string'
        },
        price: {
          label: 'Price',
          type: 'number',
          required: true
        },
        quantity: {
          label: 'Quantity',
          type: 'integer'
        }
      },
      default: {
        '@path': '$.properties.products'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties of the event',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    _update_existing_only: {
      label: 'Update Existing Only',
      description:
        'Setting this flag to true will put the API in "Update Only" mode. When using a "user_alias", "Update Only" mode is always true.',
      type: 'boolean',
      default: false
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Braze',
      description:
        'If true, Segment will batch events before sending to Braze’s user track endpoint. Braze accepts batches of up to 75 events.',
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 75,
      unsafe_hidden: true
    }
  },
  perform: (request, { settings, payload }) => {
    return sendTrackPurchase(request, settings, payload)
  },
  performBatch: (request, { settings, payload }) => {
    return sendBatchedTrackPurchase(request, settings, payload)
  }
}

export default action
