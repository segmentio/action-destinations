import type braze from '@braze/web-sdk'
import type appboy from '@braze/web-sdk-v3'

export type BrazeType = typeof braze | typeof appboy

export type BrazeDestinationClient = {
  instance: BrazeType
  ready: () => boolean
  // Records the userId from an identify observed in the current page load so that,
  // when `deferUntilIdentified` is enabled, `ready()` can gate initialization on a
  // fresh identify instead of a value persisted in localStorage.
  setDeferredUser?: (userId: string) => void
}
