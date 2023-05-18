import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  USER_ID_FIELD,
  MERGE_NESTED_OBJECTS_FIELD,
  ITEMS_FIELD,
  EMAIL_FIELD,
  USER_DATA_FIELDS,
  CommerceItem
} from '../shared-fields'
import { transformItems, convertDatesInObject } from '../utils'

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

    interface UpdateCartRequest {
      user: {
        email?: string
        userId?: string
        mergeNestedObjects?: boolean
        dataFields?: {
          [k: string]: unknown
        }
      }
      items: CommerceItem[]
    }

    const formattedDataFields = convertDatesInObject(user.dataFields ?? {})

    const updateCartRequest: UpdateCartRequest = {
      user: {
        ...user,
        dataFields: formattedDataFields
      },
      items: transformItems(items)
    }

    return request('https://api.iterable.com/api/commerce/updateCart', {
      method: 'post',
      json: updateCartRequest
    })
  }
}

export default action
