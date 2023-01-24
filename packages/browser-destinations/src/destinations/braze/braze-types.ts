import type braze from '@braze/web-sdk'
import type appboy from '@braze/web-sdk-v3'

export type BrazeType = typeof braze | typeof appboy

export type BrazeDestinationClient = {
  instance: BrazeType
  ready: () => boolean
}
