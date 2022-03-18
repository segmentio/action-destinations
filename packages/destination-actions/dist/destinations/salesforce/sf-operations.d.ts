import { RequestClient } from '@segment/actions-core'
import type { GenericPayload } from './sf-types'
export declare const API_VERSION = 'v53.0'
export default class Salesforce {
  instanceUrl: string
  request: RequestClient
  constructor(instanceUrl: string, request: RequestClient)
  createRecord: (
    payload: GenericPayload,
    sobject: string
  ) => Promise<import('@segment/actions-core').ModifiedResponse<unknown>>
  updateRecord: (
    payload: GenericPayload,
    sobject: string
  ) => Promise<import('@segment/actions-core').ModifiedResponse<unknown>>
  upsertRecord: (
    payload: GenericPayload,
    sobject: string
  ) => Promise<import('@segment/actions-core').ModifiedResponse<unknown>>
  private baseUpdate
  private buildJSONData
  private escapeQuotes
  private removeInvalidChars
  private buildQuery
  private lookupTraits
}
