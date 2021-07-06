export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = Array<JSONValue>

// If you need to also support `undefined`, though it would get dropped during serialization
export type JSONLike = JSONPrimitive | JSONLikeObject | Array<JSONLike> | Date | undefined
export type JSONLikeObject = {
  [member: string]: JSONLike
  [member: number]: JSONLike
}
