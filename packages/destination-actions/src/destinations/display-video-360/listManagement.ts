import { IntegrationError } from '@segment/actions-core'
import {
  UpdateHandlerPayload,
  BasicListTypeMap,
  BasicListAddTypeOperation,
  BasicListRemoveTypeOperation,
  ListAddOperation,
  ListRemoveOperation
} from './types'

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

const getIdentifierKey = (key: string): string => {
  let k = 'publisherProvidedId'

  switch (key) {
    case 'email':
      k = 'hashedEmail'
      break
    case 'phone':
      k = 'hashedPhoneNumber'
      break
    case 'mobile':
      k = 'mobileId'
      break
  }

  return k
}

// TODO: Implement operations for customerMatch list
export const buildAddListOperation = (
  payload: UpdateHandlerPayload,
  listType: string,
  key: string
): ListAddOperation => {
  let op: ListAddOperation = {
    create: {
      userIdentifiers: {}
    }
  }

  switch (listType) {
    case 'basicUserList':
      op = op as BasicListAddTypeOperation
      op.create.userIdentifiers['publisherProvidedId'] = payload?.user_identifier
      break
    case 'customerMatchList':
      // @ts-ignore TODO: Remove after testing
      op.create.userIdentifiers[getIdentifierKey(key)] = payload?.user_identifier
      break
    default:
      throw new IntegrationError('Invalid list type', 'INVALID_REQUEST_DATA', 400)
  }

  return op
}

export const buildRemoveListOperation = (payload: UpdateHandlerPayload, listType: string): ListRemoveOperation => {
  let op: ListRemoveOperation = {
    remove: {
      userIdentifiers: {}
    }
  }

  switch (listType) {
    case 'basicUserList':
      op = op as BasicListRemoveTypeOperation
      op.remove.userIdentifiers['publisherProvidedId'] = payload.user_identifier
      break
    case 'customerMatchList':
      // TODO: Implement this
      break
    default:
      throw new IntegrationError('Invalid list type', 'INVALID_REQUEST_DATA', 400)
  }

  return op
}
