import { JSONObject, JSONValue } from '@segment/actions-core'
export declare type ConvertFun = (rawValue: unknown) => JSONValue
export declare const ROOT: unique symbol
export declare const COPY: {}
export declare const DROP: unique symbol
export interface EventMap {
  fields: Record<string, FieldMap | typeof DROP>
  unmappedFieldObject?: string | typeof ROOT
  defaultObject?: JSONObject
  finalize?: (o: JSONObject) => JSONObject
}
export interface FieldMap extends Partial<EventMap> {
  type?: 'array' | 'object'
  name?: string | string[]
  convert?: ConvertFun
}
export declare type AnalyticsPayload = Record<string, JSONValue>
export declare function mapEvent(map: EventMap, analyticsPayload: AnalyticsPayload): JSONObject
export declare function mapEventHelper(map: EventMap, analyticsPayload: AnalyticsPayload): JSONObject | undefined
export declare function stringify(rawValue: JSONValue): string
