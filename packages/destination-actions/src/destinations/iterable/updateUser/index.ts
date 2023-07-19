import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
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
      mergeNestedObjects?: boolean
    }

    // Store the phoneNumber value before deleting from the top-level object
    const phoneNumber = payload.phoneNumber
    delete payload.phoneNumber

    const formattedDataFields = convertDatesInObject(dataFields ?? {})
    const userUpdateRequest: UserUpdateRequest = {
      ...payload,
      dataFields: {
        ...formattedDataFields,
        phoneNumber: phoneNumber
      }
    }

    const endpoint = getRegionalEndpoint('updateUser', settings.dataCenterLocation as DataCenterLocation)
    return request(endpoint, {
      method: 'post',
      json: userUpdateRequest
    })
  }
}

export default action
