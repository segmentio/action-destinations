export const removeObjectByKey = (
  mainObject: Record<string, unknown> | null | undefined,
  objectToRemove: Record<string, unknown> | null | undefined
): void => {
  if (!mainObject || !objectToRemove) {
    return
  }

  for (const key in mainObject) {
    if (
      Object.prototype.hasOwnProperty.call(mainObject, key) &&
      typeof mainObject[key] === 'object' &&
      !Array.isArray(mainObject[key])
    ) {
      if (JSON.stringify(mainObject[key]) === JSON.stringify(objectToRemove)) {
        delete mainObject[key]
        break
      }
    }
  }
}
