import { omit, IntegrationError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'

type DateInput = string | Date | number | null | undefined
type DateOutput = string | undefined | null

function toISO8601(date: DateInput): DateOutput {
  if (date === null || date === undefined) {
    return date
  }

  const d = dayjs(date)
  return d.isValid() ? d.toISOString() : undefined
}

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
          type: 'string',
          required: true
        },
        alias_label: {
          label: 'Alias Label',
          type: 'string',
          required: true
        }
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
    }
  },
  perform: (request, { settings, payload }) => {
    const { braze_id, user_alias, external_id } = payload

    if (!braze_id && !user_alias && !external_id) {
      throw new IntegrationError(
        'One of "external_id" or "user_alias" or "braze_id" is required.',
        'Missing required fields',
        400
      )
    }

    // Skip when there are no products to send to Braze
    if (payload.products.length === 0) {
      return
    }

    const reservedKeys = Object.keys(action.fields.products.properties ?? {})
    const properties = omit(payload.properties, reservedKeys)

    const base = {
      braze_id,
      external_id,
      user_alias,
      app_id: settings.app_id,
      time: toISO8601(payload.time),
      properties,
      _update_existing_only: payload._update_existing_only
    }

    const purchases = payload.products.map((product) => ({
      ...base,
      product_id: product.product_id,
      currency: product.currency ?? 'USD',
      price: product.price,
      quantity: product.quantity
    }))

    return request(`${settings.endpoint}/users/track`, {
      method: 'post',
      json: { purchases }
    })
  }
}

export default action
