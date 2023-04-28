import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  EMAIL_FIELD,
  USER_ID_FIELD,
  USER_DATA_FIELDS,
  PREFER_USER_ID_FIELD,
  MERGE_NESTED_OBJECTS_FIELD
} from '../shared-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update User',
  description: 'Creates or updates a user',
  defaultSubscription: 'type = "identify"',
  fields: {
    email: {
      ...EMAIL_FIELD,
      default: { '@path': '$.traits.email' }
    },
    userId: {
      ...USER_ID_FIELD
    },
    dataFields: {
      ...USER_DATA_FIELDS
    },
    preferUserId: {
      ...PREFER_USER_ID_FIELD
    },
    mergeNestedObjects: {
      ...MERGE_NESTED_OBJECTS_FIELD
    }
  },
  perform: (request, { payload }) => {
    const { email, userId, dataFields } = payload

    if (!email && !userId) {
      throw new PayloadValidationError('Must include email or userId.')
    }

    interface UserUpdateRequest {
      email?: string
      userId?: string
      dataFields?: {
        [k: string]: unknown
      }
      preferUserId?: boolean
      mergeNestedObjects?: boolean
      createNewFields?: boolean
    }

    if (dataFields?.phone) {
      dataFields.phoneNumber = dataFields.phone
      delete dataFields.phone
    }

    const userUpdateRequest: UserUpdateRequest = Object.entries(payload).reduce(
      (json, [key, value]) => (value ? { ...json, [key]: value } : json),
      {}
    )

    return request('https://api.iterable.com/api/users/update', {
      method: 'post',
      json: userUpdateRequest
    })
  }
}

export default action
