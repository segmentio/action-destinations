import { JSONObject, RequestClient, RequestOptions } from '@segment/actions-core'
import { Settings } from './generated-types'
export declare const defaultMapiBaseUrl = 'https://mapi.fbot.me'
export declare function getMapiBaseUrl(authSecret: string): string[]
export declare function createMapiRequest(
  path: string,
  request: RequestClient,
  settings: Settings,
  friendbuyPayload: JSONObject
): Promise<[string, RequestOptions]>
export declare function getAuthToken(
  request: RequestClient,
  mapiBaseUrl: string,
  authKey: string,
  authSecret: string
): Promise<string>
