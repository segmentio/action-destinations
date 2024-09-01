export type ValueOrError<T> = { value?: T; error?: any } //& ({ value: T } | { error: any });

export function getOrCatch<T>(getValue: () => Promise<T>): Promise<ValueOrError<T>>
export function getOrCatch<T>(getValue: () => T): ValueOrError<T>
export function getOrCatch(getValue: () => any): Promise<ValueOrError<any>> | ValueOrError<any> {
  try {
    const value = getValue()

    if (value instanceof Promise) {
      return value.then((value) => ({ value })).catch((error) => ({ error }))
    } else {
      return { value }
    }
  } catch (error) {
    return { error }
  }
}
