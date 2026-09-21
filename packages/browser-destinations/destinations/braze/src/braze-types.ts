import type braze from '@braze/web-sdk'
import type appboy from '@braze/web-sdk-v3'

export type BrazeType = typeof braze | typeof appboy

export type BrazeDestinationClient = {
  instance: BrazeType
  ready: () => boolean
  // Records the userId from an identify observed in the current page load so that,
  // when `deferUntilIdentified` is enabled, `ready()` can gate initialization on a
  // fresh identify instead of a value persisted in localStorage. The SDK Authentication
  // signature is captured alongside it so the deferred `changeUser` can be authenticated
  // on the very first call, before any request is made for the identified user.
  setDeferredUser: (userId: string, sdkAuthSignature?: string) => void
  // Identifies the user with Braze, authenticating the call when an SDK Authentication
  // signature is supplied. Routes a refreshed signature for the already-identified user
  // to `setSdkAuthenticationSignature`, which is how Braze documents rotating a token
  // mid-session.
  identifyUser: (userId: string, sdkAuthSignature?: string) => void
}
