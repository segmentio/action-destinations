export type Visitor = {
  id?: string | null | undefined
}

export type Account = {
  id?: string | null | undefined
}

export type InitializeData = {
  visitor?: Visitor
  account?: Account
  parentAccount?: Account
}

export type identifyPayload = {
  visitor: { [key: string]: string }
  account?: { [key: string]: string }
  parentAccount?: { [key: string]: string }
}

export type PendoSDK = {
  initialize: ({ visitor, account }: InitializeData) => void
  track: (eventName: string, metadata?: { [key: string]: unknown }) => void
  identify: (data: identifyPayload) => void
  isReady: () => boolean
}
