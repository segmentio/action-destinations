import { Payload } from './generated-types'

export const isPlainObj = (o: object | string) =>
    Boolean(
      o &&
        o.constructor &&
        o.constructor.prototype &&
        Object.prototype.hasOwnProperty.call(o.constructor.prototype, 'isPrototypeOf')
)
  
export const flattenObj = (obj: { [k: string]: any }, keys = [] as string[]) : {[k: string]: any } => {
    return Object.keys(obj).reduce((acc, key) => {
      return Object.assign(
        acc,
        isPlainObj(obj[key]) ? flattenObj(obj[key], keys.concat(key)) : { [keys.concat(key).join('.')]: obj[key] }
      )
    }, {} as {[k: string]: unknown })
}
  
export const payloadTransform = (payload: Payload) => {
    if (payload.attributes && Object.keys(payload.attributes).length > 0) { 
      payload.attributes = flattenObj(payload.attributes)
    }
    return payload
}