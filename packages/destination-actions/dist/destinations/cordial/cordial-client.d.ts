import { Settings } from './generated-types'
import { RequestClient } from '@segment/actions-core'
import { Payload as ContactActivityPayload } from './createContactactivity/generated-types'
import { UserIdentifier } from './user-identifier'
interface Attribute {
  name: string
  type: string
  key: string
}
interface ContactAttributes {
  [key: string]: string | number
}
interface List {
  id: number
  name: string
  segment_group_id: string
}
declare class CordialClient {
  private readonly apiUrl
  private readonly request
  constructor(settings: Settings, request: RequestClient)
  addContactActivity(
    payload: ContactActivityPayload
  ): Promise<import('@segment/actions-core').ModifiedResponse<unknown>>
  upsertContact(
    userIdentifier: UserIdentifier,
    attributes?: ContactAttributes
  ): Promise<import('@segment/actions-core').ModifiedResponse<unknown>>
  getList(segmentGroupId: string, listName?: string): Promise<List | null>
  upsertList(segmentGroupId: string, listName?: string): Promise<List>
  addContactToList(
    userIdentifier: UserIdentifier,
    list: List
  ): Promise<import('@segment/actions-core').ModifiedResponse<unknown>>
  removeContactFromList(
    userIdentifier: UserIdentifier,
    list: List
  ): Promise<import('@segment/actions-core').ModifiedResponse<unknown>>
  transformAttributes(rawAttributes: { [key: string]: any }): Promise<ContactAttributes>
  protected getAttributes(): Promise<{
    [key: string]: Attribute
  }>
  protected prepareListName(listName: string): string
}
export default CordialClient
