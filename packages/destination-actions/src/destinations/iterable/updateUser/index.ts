import { ActionDefinition, PayloadValidationError, DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'
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
  users: UserUpdateRequestPayload[]
}

const transformIterableUserPayload: (payload: Payload) => UserUpdateRequestPayload = (payload) => {
  // Store the phoneNumber value before deleting from the top-level object
  const phoneNumber = payload.phoneNumber
  delete payload.phoneNumber

  const formattedDataFields = convertDatesInObject(payload.dataFields ?? {})
  const userUpdateRequest: UserUpdateRequestPayload = {
    ...payload,
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
    dataFields: {
      ...USER_DATA_FIELDS
    },
    phoneNumber: {
      ...USER_PHONE_NUMBER_FIELD
    },
    mergeNestedObjects: {
      ...MERGE_NESTED_OBJECTS_FIELD
    }
  },
  perform: (request, { payload, settings }) => {
    if (!payload.email && !payload.userId) {
      throw new PayloadValidationError('Must include email or userId.')
    }

    const updateUserRequestPayload: UserUpdateRequestPayload = transformIterableUserPayload(payload)

    const endpoint = getRegionalEndpoint('updateUser', settings.dataCenterLocation as DataCenterLocation)
    return request(endpoint, {
      method: 'post',
      json: updateUserRequestPayload,
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    })
  },
  performBatch: (request, { settings, payload }) => {
    const bulkUpdateUserRequestPayload: BulkUserUpdateRequestPayload = {
      users: payload.map(transformIterableUserPayload)
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
