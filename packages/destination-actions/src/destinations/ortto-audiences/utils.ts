export function cleanObject<T extends {}>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key, _]) => key !== '')
      .map(([key, value]) => [key, value instanceof Object && !(value instanceof Array) ? cleanObject(value) : value])
  ) as Partial<T>
}
