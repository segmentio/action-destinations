import { ActionDefinition, PayloadValidationError, DEFAULT_REQUEST_TIMEOUT, omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  EMAIL_FIELD,
  USER_ID_FIELD,
  USER_DATA_FIELDS,
  MERGE_NESTED_OBJECTS_FIELD,
  USER_PHONE_NUMBER_FIELD,
  DataCenterLocation
} from '../shared-fields'
import { convertDatesInObject, getRegionalEndpoint } from '../utils'

interface UserUpdateRequestPayload {
  email?: string
  userId?: string
  dataFields?: {
    [k: string]: unknown
  }
  mergeNestedObjects?: boolean
}

interface BulkUserUpdateRequestPayload {
  updateOnly?: boolean
  users: UserUpdateRequestPayload[]
}

const transformIterableUserPayload: (payload: Payload) => UserUpdateRequestPayload = (payload) => {
  const phoneNumber = payload.phoneNumber
  const formattedDataFields = convertDatesInObject(payload.dataFields ?? {})
  const userUpdateRequest: UserUpdateRequestPayload = {
    ...omit(payload, ['newEmail', 'updateOnly', 'enable_batching', 'batch_size', 'phoneNumber']),
    dataFields: {
      ...formattedDataFields,
      phoneNumber: phoneNumber
    }
  }
  return userUpdateRequest
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert User',
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
    newEmail: {
      label: 'New Email Address',
      description:
        'The new email address to assign to the user. For single event processing, Segment makes a separate API call to set the new email address. Batch updating a profile email address is only supported for Hybrid projects.',
      type: 'string',
      format: 'email',
      required: false
    },
    dataFields: {
      ...USER_DATA_FIELDS
    },
    phoneNumber: {
      ...USER_PHONE_NUMBER_FIELD
    },
    mergeNestedObjects: {
      ...MERGE_NESTED_OBJECTS_FIELD
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'When enabled, Segment will send data to Iterable in batches of up to 1001',
      type: 'boolean',
      required: false,
      default: true
    },
    updateOnly: {
      label: 'Update Only',
      description: 'When enabled, Segment will only update existing users in Iterable. New users will not be created. This is only applicable when batching is enabled. Talk to your Iterable representative to enable this feature on the Iterable side.',
      type: 'boolean',
      required: false, 
      disabledInputMethods: ['variable', 'function', 'freeform', 'enrichment'],
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'enable_batching',
            operator: 'is',
            value: true
          }
        ]
      }
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 1001
    }
  },
  perform: async (request, { payload, settings }) => {
    if (!payload.email && !payload.userId) {
      throw new PayloadValidationError('Must include email or userId.')
    }

    const updateUserRequestPayload: UserUpdateRequestPayload = transformIterableUserPayload(payload)

    const updateUserEndpoint = getRegionalEndpoint('updateUser', settings.dataCenterLocation as DataCenterLocation)
    const response = await request(updateUserEndpoint, {
      method: 'post',
      json: updateUserRequestPayload,
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    })

    if (!payload.newEmail) {
      return response
    }

    const updateEmailEndpoint = getRegionalEndpoint('updateEmail', settings.dataCenterLocation as DataCenterLocation)
    return request(updateEmailEndpoint, {
      method: 'post',
      json: {
        ...(payload.email ? { currentEmail: payload.email } : {}),
        ...(payload.userId ? { currentUserId: payload.userId } : {}),
        newEmail: payload.newEmail
      },
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    })
  },
  performBatch: (request, { settings, payload }) => {
    const { updateOnly } = payload[0]
    const users = payload.map((p) => {
      const user = transformIterableUserPayload(p)
      if (p.newEmail) {
        user.dataFields = {
          ...user.dataFields,
          email: p.newEmail
        }
      }
      return user
    })
    const bulkUpdateUserRequestPayload: BulkUserUpdateRequestPayload = {
      ...(updateOnly ? { updateOnly } : {}),
      users
    }

    const endpoint = getRegionalEndpoint('bulkUpdateUser', settings.dataCenterLocation as DataCenterLocation)
    return request(endpoint, {
      method: 'post',
      json: bulkUpdateUserRequestPayload,
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    })
  }
}

export default action