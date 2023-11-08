import { IntegrationError } from '@segment/actions-core'
import { IdType, UpdateHandlerPayload, BasicListTypeMap, ListAddOperation, ListRemoveOperation } from './types'

export const buildListTypeMap = (listType: string): BasicListTypeMap => {
  switch (listType) {
    case 'basicUserList':
      return { basicUserList: {}, type: 'REMARKETING', membershipStatus: 'OPEN' }
    case 'customerMatchList':
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
    default:
      throw new IntegrationError('Invalid list type', 'INVALID_REQUEST_DATA', 400)
  }
}
export const buildAddListOperation = (payload: UpdateHandlerPayload): ListAddOperation => {
  const key = payload.user_identifier as IdType
  const value = payload.identifier_value

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
