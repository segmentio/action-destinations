import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'
import {
  EMAIL_FIELD,
  USER_ID_FIELD,
  CREATED_AT_FIELD,
  MERGE_NESTED_OBJECTS_FIELD,
  ITEMS_FIELD,
  CAMPAGIN_ID_FIELD,
  TEMPLATE_ID_FIELD,
  EVENT_DATA_FIELDS,
  USER_DATA_FIELDS,
  CommerceItem
} from '../shared-fields'
import { transformItems, convertDatesInObject } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Purchase',
  description: 'Tracks a purchase to Iterable',
  defaultSubscription: 'type = "track" and event == "Order Completed"',
  fields: {
    id: {
      label: 'Order ID',
      description:
        'Similar to `Event ID` in custom events. Iterable recommends mapping `order_id` or `messageId`. If a purchase exists with that id, the purchase will be updated. If none is specified, a new id will automatically be generated by Iterable',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.order_id'
      }
    },
    user: {
      label: 'User Data',
      description: 'Updates user data or adds a user if none exists',
      type: 'object',
      required: true,
      additionalProperties: false,
      defaultObjectUI: 'keyvalue:only',
      default: {
        email: {
          '@if': {
            exists: { '@path': '$.properties.email' },
            then: { '@path': '$.properties.email' },
            else: { '@path': '$.context.traits.email' }
          }
        },
        userId: { '@path': '$.userId' },
        dataFields: { '@path': '$.context.traits' },
        mergeNestedObjects: false
      },
      properties: {
        email: {
          ...EMAIL_FIELD
        },
        userId: {
          ...USER_ID_FIELD
        },
        dataFields: {
          ...USER_DATA_FIELDS
        },
        mergeNestedObjects: {
          ...MERGE_NESTED_OBJECTS_FIELD
        }
      }
    },
    dataFields: {
      ...EVENT_DATA_FIELDS
    },
    items: {
      ...ITEMS_FIELD
    },
    total: {
      label: 'Total',
      description: 'Total order dollar amount.',
      type: 'number',
      required: true,
      default: { '@path': '$.properties.total' }
    },
    createdAt: {
      ...CREATED_AT_FIELD
    },
    campaignId: {
      ...CAMPAGIN_ID_FIELD
    },
    templateId: {
      ...TEMPLATE_ID_FIELD
    }
  },
  perform: (request, { payload }) => {
    const { user, dataFields } = payload

    if (!user.email && !user.userId) {
      throw new PayloadValidationError('Must include email or userId.')
    }

    interface TrackPurchaseRequest {
      id?: string
      user: {
        email?: string
        userId?: string
        mergeNestedObjects?: boolean
        dataFields?: {
          [k: string]: unknown
        }
      }
      items: CommerceItem[]
      campaignId?: number
      templateId?: number
      createdAt?: number
      total: number
      dataFields?: {
        [k: string]: unknown
      }
    }

    // Remove 'products' duplicate from dataFields
    if (dataFields && Object.prototype.hasOwnProperty.call(dataFields, 'products')) {
      delete dataFields.products
    }

    const formattedDataFields = convertDatesInObject(dataFields ?? {})

    const trackPurchaseRequest: TrackPurchaseRequest = {
      ...payload,
      user: {
        ...payload.user,
        dataFields: convertDatesInObject(payload.user.dataFields ?? {})
      },
      items: transformItems(payload.items),
      createdAt: dayjs(payload.createdAt).unix(),
      dataFields: formattedDataFields
    }

    return request('https://api.iterable.com/api/commerce/trackPurchase', {
      method: 'post',
      json: trackPurchaseRequest
    })
  }
}

export default action
