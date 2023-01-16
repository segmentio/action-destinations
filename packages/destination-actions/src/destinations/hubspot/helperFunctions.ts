// Flatten JSON object
// Example: {arr: [1,2,3,4]} => {arr: "1;2;3;4"}

type JSONObject = { [key: string]: unknown } | undefined

export function flattenObject(obj: JSONObject) {
  if (typeof obj === 'undefined' || obj === null) return obj

  const flattened: JSONObject = {}

  Object.keys(obj).forEach((key: string) => {
    // Skip if the value is null or undefined or not own property

    if (typeof obj[key] === 'undefined' || obj[key] == null || !Object.prototype.hasOwnProperty.call(obj, key)) {
      return
    }

    // Flatten if item is an array
    if (obj[key] instanceof Array) {
      flattened[key] = (obj[key] as Array<unknown>)
        .map((item: unknown) => {
          if (typeof item === 'object') {
            try {
              return `Object(${JSON.stringify(item)})`
            } catch (e) {
              return '[non-serializable]'
            }
          }
          return item
        })
        .join(';')
      return
    }

    // Flatten if item is an object
    if (typeof obj[key] === 'object') {
      try {
        flattened[key] = `Object(${JSON.stringify(obj[key])})`
      } catch (e) {
        flattened[key] = '[non-serializable]'
      }
      return
    }

    flattened[key] = obj[key]
  })

  return flattened
}
