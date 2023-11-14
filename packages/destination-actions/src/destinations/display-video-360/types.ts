import type { Payload as AddToAudiencePayload } from './addToAudience/generated-types'
import type { Payload as RemoveFromAudiencePayload } from './removeFromAudience/generated-types'

export interface RefreshTokenResponse {
  access_token: string
}

export interface GoogleAPIError {
  response: {
    status: number
    data: {
      error: {
        message: string
      }
    }
  }
}

export type ListOperation = 'add' | 'remove'

export type UpdateHandlerPayload = AddToAudiencePayload & RemoveFromAudiencePayload

export type IdType = 'hashedEmail' | 'hashedPhoneNumber' | 'mobileId' | 'publisherProvidedId'

export type SupportedIdentifiers = {
  [key in IdType]?: string
}

export type BasicListTypeMap =
  | {
      basicUserList: any
      [key: string]: any
    }
  | {
      crmBasedUserList: any
      [key: string]: any
    }

export type BasicListAddTypeOperation = {
  create: {
    userIdentifiers: [SupportedIdentifiers]
  }
}

export type BasicListRemoveTypeOperation = {
  remove: {
    userIdentifiers: [SupportedIdentifiers]
  }
}

export type CustomerMatchAddListOperation = {
  create: {
    userIdentifiers: [SupportedIdentifiers]
  }
}

export type CustomerMatchRemoveListOperation = {
  remove: {
    userIdentifiers: [SupportedIdentifiers]
  }
}

export type ListAddOperation = BasicListAddTypeOperation | CustomerMatchAddListOperation
export type ListRemoveOperation = BasicListRemoveTypeOperation | CustomerMatchRemoveListOperation
