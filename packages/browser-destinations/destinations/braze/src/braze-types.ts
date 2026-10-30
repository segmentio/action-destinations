import type braze from '@braze/web-sdk'
import type appboy from '@braze/web-sdk-v3'

export type BrazeType = typeof braze | typeof appboy

export type BrazeDestinationClient = {
  instance: BrazeType
  // `externalId` is the id the caller is about to identify the user as (Update User Profile), so a
  // session that starts because of that identify opens for the mapped id and not the Segment user id.
  ready: (externalId?: string) => boolean
}
