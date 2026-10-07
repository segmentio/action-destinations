import type braze from '@braze/web-sdk'
import type appboy from '@braze/web-sdk-v3'

export type BrazeType = typeof braze | typeof appboy

export type BrazeDestinationClient = {
  instance: BrazeType
  ready: () => boolean
  // Identifies the user with Braze, authenticating the call when an SDK Authentication
  // signature is supplied and the setting is on. The signature is also applied explicitly
  // with `setSdkAuthenticationSignature`, because SDK 3.3's `changeUser` ignores it for a
  // user who is already current.
  identifyUser: (userId: string, sdkAuthSignature?: string) => void
}
