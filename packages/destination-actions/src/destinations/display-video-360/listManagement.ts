import { IntegrationError } from '@segment/actions-core'
import { IdType, UpdateHandlerPayload, BasicListTypeMap, ListAddOperation, ListRemoveOperation } from './types'
import { createHash } from 'crypto'

export const buildListTypeMap = (listType: string): BasicListTypeMap => {
  switch (listType) {
    case 'basicUserList':
      return { basicUserList: {}, type: 'REMARKETING', membershipStatus: 'OPEN' }
    case 'crmBasedUserList':
      // Implement MOBILE_ADVERTISING_ID
      return { crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' } }
    default:
      throw new IntegrationError('Invalid list type', 'INVALID_REQUEST_DATA', 400)
  }
}

export const prepareOfflineDataJobCreationParams = (listType: string, listId: string) => {
  switch (listType) {
    case 'basicUserList':
      return {
        job: {
          type: 'DATA_MANAGEMENT_PLATFORM_USER_LIST',
          dataManagementPlatformUserListMetadata: {
            userList: listId
          }
        }
      }
    case 'crmBasedUserList':
      return {
        job: {
          type: 'CUSTOMER_MATCH_USER_LIST',
          customerMatchUserListMetadata: {
            userList: listId
          }
        }
      }
    default:
      throw new IntegrationError('Invalid list type', 'INVALID_REQUEST_DATA', 400)
  }
}
export const buildAddListOperation = (payload: UpdateHandlerPayload): ListAddOperation => {
  let value = payload.identifier_value
  const key = payload.user_identifier as IdType

  if (key.startsWith('hash')) {
    value = value.toLowerCase().trim()
    value = createHash('sha256').update(payload.identifier_value).digest('hex')
  }

  const op: ListAddOperation = {
    create: {
      userIdentifiers: [{ [key]: value }]
    }
  }

  return op
}

export const buildRemoveListOperation = (payload: UpdateHandlerPayload): ListRemoveOperation => {
  const key = payload.user_identifier as IdType
  const value = payload.identifier_value

  const op: ListRemoveOperation = {
    remove: {
      userIdentifiers: [{ [key]: value }]
    }
  }

  return op
}
