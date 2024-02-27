export interface AnyObject {
  [key: string]: AnyObject | undefined
}

export const removeNestedObject = function (obj: AnyObject, path: string): AnyObject {
  const pathArray = path.split('.').filter(Boolean)

  const newObj: AnyObject = { ...obj } // Create a new object to avoid mutating the original

  let currentObj: AnyObject | undefined = newObj

  for (let i = 0; i < pathArray.length; i++) {
    const key = pathArray[i]

    if (
      typeof currentObj === 'object' &&
      currentObj !== null &&
      Object.prototype.hasOwnProperty.call(currentObj, key)
    ) {
      if (i == pathArray.length - 1) {
        delete currentObj[key]
      } else {
        currentObj[key] = { ...currentObj[key] } as AnyObject // Create a new object for nested properties
        currentObj = currentObj[key]
      }
    } else {
      return newObj
    }
  }
  return newObj
}

export const getSubstringDifference = (
  str1: string | undefined | null,
  str2: string | undefined | null
): string | null => {
  if (str1 === undefined || str1 === null || str2 === undefined || str2 === null) {
    return null
  }

  return str1.startsWith(str2) ? str1.substring(str2.length) : null
}
