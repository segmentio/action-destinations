import type { Payload as StandardEvent } from './standardEvent/generated-types'
import type { Payload as CustomEvent } from './customEvent/generated-types'
import { processHashing } from '../../lib/hashing-utils'

// Field types shared across both actions (standardEvent | customEvent).
export type EventMetadataType = StandardEvent['event_metadata'] | CustomEvent['event_metadata']
export type ProductsType = StandardEvent['products'] | CustomEvent['products']
export type ConversionIdType = StandardEvent['conversion_id'] | CustomEvent['conversion_id']
export type DataProcessingOptionsType =
  | StandardEvent['data_processing_options']
  | CustomEvent['data_processing_options']
export type UserType = StandardEvent['user'] | CustomEvent['user']
export type ScreenDimensionsType = StandardEvent['screen_dimensions'] | CustomEvent['screen_dimensions']

export function clean(str: string | undefined): string | undefined {
  if (str === undefined || str === null || str === '') return undefined
  return str.trim()
}

export function cleanNum(num: number | undefined): number | undefined {
  if (num === undefined || num === null) return undefined
  return num
}

export function getScreen(height?: number, width?: number): { height: number; width: number } | undefined {
  if (height === undefined || width === undefined) return undefined
  return { height, width }
}

export function canonicalizeEmail(value: string): string {
  value = value.trim()
  const localPartAndDomain = value.split('@')
  const localPart = localPartAndDomain[0].replace(/\./g, '').split('+')[0]
  return `${localPart.toLowerCase()}@${localPartAndDomain[1].toLowerCase()}`
}

export const smartHash = (
  value: string | undefined,
  cleaningFunction?: (value: string) => string
): string | undefined => {
  if (value === undefined) return
  return processHashing(value, 'sha256', 'hex', cleaningFunction)
}

export function cleanPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return ''
  phoneNumber = phoneNumber.trim()
  const prefix = '+'
  if (phoneNumber.startsWith('+')) {
    phoneNumber = phoneNumber.slice(1)
  }
  // Remove any potential extensions from the number
  const extensions = ['ext', 'x', 'anexo', '#', 'poste', 'int']
  const lower = phoneNumber.toLowerCase()
  for (const keyword of extensions) {
    const index = lower.indexOf(keyword)
    if (index !== -1) {
      phoneNumber = phoneNumber.slice(0, index)
      break
    }
  }
  // Add the prefix and remove all non-numeric characters
  const digitsOnly = phoneNumber.replace(/\D/g, '')
  return prefix + digitsOnly
}

export function getAdId(
  device_type?: string,
  advertising_id?: string
): { [key: string]: string | undefined } | undefined {
  if (!device_type) return undefined
  if (!advertising_id) return undefined
  const hashedAdId = smartHash(advertising_id)
  return device_type === 'ios' ? { idfa: hashedAdId } : { aaid: hashedAdId }
}
