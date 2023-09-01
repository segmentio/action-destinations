export type Visitor = {
  id?: string | null | undefined
}

export type Account = {
  id?: string | null | undefined
}

export type InitializeData = {
  visitor?: Visitor
  account?: Account
}

export type identifyPayload = { visitor: { [key: string]: string }; account?: { [key: string]: string } }

export interface PendoSDK {
  initialize: ({ visitor, account }: InitializeData) => void
  track: (eventName: string, metadata?: { [key: string]: unknown }) => void
  identify: (data: identifyPayload) => void
  isReady: () => boolean
}
