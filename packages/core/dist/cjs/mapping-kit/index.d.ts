import { JSONObject, JSONLikeObject } from '../json-object'
export declare type InputData = {
  [key: string]: unknown
}
export declare function transform(mapping: JSONLikeObject, data?: InputData | undefined): JSONObject
export declare function transformBatch(mapping: JSONLikeObject, data?: Array<InputData> | undefined): JSONObject[]
