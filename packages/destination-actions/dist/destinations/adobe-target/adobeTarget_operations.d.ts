import { RequestClient } from '@segment/actions-core'
export default class AdobeTarget {
  userId: string
  clientCode: string
  traits: object
  request: RequestClient
  constructor(userId: string, clientCode: string, traits: object, request: RequestClient)
  updateProfile: () => Promise<import('@segment/actions-core').ModifiedResponse<unknown>>
  private lookupProfile
}
