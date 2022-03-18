import { Settings } from '../generated-types'
import type { ExecuteInput, ModifiedResponse, RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
interface SearchFieldTypes {
  deal: 'dealField'
  person: 'personField'
  organization: 'organizationField'
  product: 'productField'
}
declare type ItemType = keyof SearchFieldTypes
interface PipedriveFieldTypes extends SearchFieldTypes {
  activity: 'activityFields'
  note: 'noteFields'
}
declare class PipedriveClient {
  private settings
  private _request
  constructor(settings: Settings, request: RequestClient)
  getId(item: ItemType, fieldName: string, term?: string): Promise<number | null>
  getFields(item: keyof PipedriveFieldTypes): Promise<DynamicFieldResponse>
  getActivityTypes(): Promise<DynamicFieldResponse>
  createUpdate(itemPath: string, item: Record<string, unknown>): Promise<ModifiedResponse>
  post(path: string, payload: Record<string, unknown>): Promise<ModifiedResponse>
  put(path: string, payload: Record<string, unknown>): Promise<ModifiedResponse>
  reqWithPayload(
    path: string,
    payload: Record<string, unknown>,
    method: 'post' | 'put'
  ): Promise<ModifiedResponse<unknown>>
  static filterPayload(payload: Record<string, unknown>): void
  static fieldHandler(
    fieldType: keyof PipedriveFieldTypes
  ): (request: RequestClient, { settings }: ExecuteInput<Settings, unknown>) => Promise<DynamicFieldResponse>
}
export default PipedriveClient
