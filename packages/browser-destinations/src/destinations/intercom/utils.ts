import { isArray, isObject } from '@segment/actions-core'
import { isNonEmpty } from '@segment/actions-shared'
import dayjs from 'dayjs'

export function convertDateToUnix(created_at: string | number): number {
  if (typeof created_at === 'number') {
    let unixDate = dayjs.unix(created_at).unix()
    if (unixDate.toString().length == 13) {
      unixDate = Math.floor(unixDate / 1000)
    }
    return unixDate
  }
  return dayjs(created_at).unix()
}

export function filterCustomTraits(traits: { [k: string]: unknown } | undefined) {
  const filteredCustomTraits: { [k: string]: unknown } = {}
  if (traits) {
    for (const [key, value] of Object.entries(traits)) {
      if (!isArray(value) && !isObject(value)) {
        filteredCustomTraits[key] = value
      }
    }
  }
  return filteredCustomTraits
}

export function getWidgetOptions(hide_default_launcher: boolean | undefined, activator: string | undefined) {
  const widgetOptions: { [key: string]: unknown } = {}
  if (hide_default_launcher !== undefined) {
    widgetOptions.hide_default_launcher = hide_default_launcher
  }
  if (activator !== '#IntercomDefaultWidget') {
    widgetOptions.widget = {
      activator: activator
    }
  }
  return widgetOptions
}

export function isEmpty(o: object | undefined) {
  return !isNonEmpty(o)
}
