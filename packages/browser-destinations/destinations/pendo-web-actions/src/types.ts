import { ID } from '@segment/analytics-next'

export type Visitor = {
  id: ID
  [propName: string]: unknown
}

export type Account = {
  id: ID
  [propName: string]: unknown
}

export type PendoOptions = {
  visitor?: Visitor
  account?: Account
  parentAccount?: Account
}

export type PendoSDK = {
  initialize: ({ visitor, account }: PendoOptions) => void
  track: (eventName: string, metadata?: { [key: string]: unknown }) => void
  identify: (data: PendoOptions) => void
  flushNow: (force: boolean) => void
  isReady: () => boolean
}
