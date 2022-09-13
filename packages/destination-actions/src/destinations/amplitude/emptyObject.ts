import { Payload as LogPayload } from './logEvent/generated-types'

/**
 * takes a object and removes all keys with a falsey value. Then checks if the object is empty or not
 *
 * @param object the setAlways, setOnce, or add object from the LogEvent payload
 * @returns a boolean signifying whether the resulting object is empty or not
 */

export default function removeEmptyKeysAndCheckIfEmpty(
  object: LogPayload['setOnce'] | LogPayload['setAlways'] | LogPayload['add']
): boolean {
  return Object.keys(Object.fromEntries(Object.entries(object ?? {}).filter(([_, v]) => v))).length > 0
}
