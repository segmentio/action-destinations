import type { Payload as AddToAudiencePayload } from './addToAudience/generated-types'
import type { Payload as RemoveFromAudiencePayload } from './removeFromAudience/generated-types'

export type ListOperation = 'add' | 'remove'

export type UpdateHandlerPayload = AddToAudiencePayload & RemoveFromAudiencePayload

export type BasicListTypeMap =
  | { basicUserList: any; [key: string]: any }
  | { crmBasedUserList: any; [key: string]: any }
export type BasicListAddTypeOperation = {
  create: {
    userIdentifiers: {
      publisherProvidedId: string
    }
  }
}

export type BasicListRemoveTypeOperation = {
  remove: {
    userIdentifiers: {
      publisherProvidedId: string
    }
  }
}

export type CustomerMatchAddListOperation = {
  create: {
    userIdentifiers: {
      hashedEmail?: string
      hashedPhoneNumber?: string
      mobileId?: string
      publisherProvidedId?: string
    }
  }
}

export type CustomerMatchRemoveListOperation = {
  remove: {
    userIdentifiers: {
      hashedEmail?: string
      hashedPhoneNumber?: string
      mobileId?: string
      publisherProvidedId?: string
    }
  }
}

export type ListAddOperation = BasicListAddTypeOperation | CustomerMatchAddListOperation
export type ListRemoveOperation = BasicListRemoveTypeOperation | CustomerMatchRemoveListOperation
