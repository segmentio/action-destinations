import { ActionDefinition, PayloadValidationError, omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  USER_ID_FIELD,
  PREFER_USER_ID_FIELD,
  MERGE_NESTED_OBJECTS_FIELD,
  ITEMS_FIELD,
  EMAIL_FIELD,
  USER_DATA_FIELDS
} from '../shared-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Cart',
  description: 'Updates shoppingCartItems field on the user profile.',
  defaultSubscription: 'type = "track" and event == "Update Cart"',
  fields: {
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
        dataFields: { '@path': '$.context.traits' }
      },
      properties: {
        email: {
          ...EMAIL_FIELD
        },
        userId: {
          ...USER_ID_FIELD
        },
        preferUserId: {
          ...PREFER_USER_ID_FIELD
        },
        mergeNestedObjects: {
          ...MERGE_NESTED_OBJECTS_FIELD
        },
        dataFields: {
          ...USER_DATA_FIELDS
        }
      }
    },
    items: {
      ...ITEMS_FIELD
    }
  },
  perform: (request, { payload }) => {
    const { user, items } = payload
    if (!user.email && !user.userId) {
      throw new PayloadValidationError('Must include email or userId.')
    }

    const reservedItemKeys = [
      'product_id',
      'id',
      'sku',
      'name',
      'price',
      'quantity',
      'categories',
      'category',
      'url',
      'image_url'
    ]

    function hasRequiredFields(items: Payload['items']) {
      const requiredItemKeys = ['id', 'name', 'price', 'quantity']
      return items.every((item) => requiredItemKeys.every((field) => Object.prototype.hasOwnProperty.call(item, field)))
    }

    /**
     * Transforms an array of product items by removing reserved keys from dataFields and converting categories to string arrays.
     */
    function transformItems(items: Payload['items']): CartItem[] {
      if (!items || !hasRequiredFields(items)) {
        throw new PayloadValidationError('Product items must include item id, name, price, and quanity.')
      }

      return items.map(({ dataFields, categories, ...rest }) => ({
        ...rest,
        dataFields: omit(dataFields, reservedItemKeys),
        ...(categories && { categories: [categories] })
      }))
    }

    type CartItem = {
      id?: string
      name?: string
      sku?: string
      quantity?: number
      price?: number
      description?: string
      categories?: string[]
      url?: string
      imageUrl?: string
      dataFields?: {
        [k: string]: unknown
      }
    }

    interface UpdateCartRequest {
      user: {
        email?: string
        userId?: string
        mergeNestedObjects?: boolean
        preferUserId?: boolean
        dataFields?: {
          [k: string]: unknown
        }
      }
      items: CartItem[]
    }

    const updateCartRequest: UpdateCartRequest = {
      user,
      items: transformItems(items)
    }

    return request('https://api.iterable.com/api/commerce/updateCart', {
      method: 'post',
      json: updateCartRequest
    })
  }
}

export default action
