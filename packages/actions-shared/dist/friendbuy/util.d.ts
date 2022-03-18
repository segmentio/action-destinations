import type { JSONObject, JSONValue } from '@segment/actions-core'
import type { FriendbuyAPI } from './commonFields'
import { AnalyticsPayload } from './mapEvent'
export interface GetNameParams {
  name?: string
  firstName?: string
  lastName?: string
}
export declare function getName(payload: GetNameParams): string | undefined
export declare function addName(payload: GetNameParams | undefined): void
export declare function removeCustomerIfNoId(payload: {
  customer?: {
    id?: string
  }
}): {
  customer?:
    | {
        id?: string | undefined
      }
    | undefined
}
export declare function moveEventPropertiesToRoot(payload: AnalyticsPayload): AnalyticsPayload
declare type NotUndefined<T> = T extends undefined ? never : T
export declare function isNonEmpty<T extends unknown>(o: T): o is NotUndefined<T>
export declare type FriendbuyPayloadItem = [string, JSONValue | undefined]
export interface CreateFriendbuyPayloadFlags {
  dropEmpty?: boolean
}
export declare function createFriendbuyPayload(
  payloadItems: FriendbuyPayloadItem[],
  flags?: CreateFriendbuyPayloadFlags
): JSONObject
export declare type DateRecord = {
  year?: number
  month: number
  day: number
}
export declare function filterFriendbuyAttributes(
  api: FriendbuyAPI,
  friendbuyAttributes: Record<string, unknown> | undefined
): [string, JSONValue][]
export declare function parseDate(date: string | DateRecord | undefined): DateRecord | undefined
export declare function enjoinInteger(input: unknown): unknown
export declare function enjoinNumber(input: unknown): unknown
export declare function enjoinString(input: unknown): unknown
export {}
