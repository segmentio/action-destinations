type method = 'trackEvent' | 'update'

type IntercomApi = {
  booted: boolean
  richLinkProperties: string[] | undefined
  appId: string
  customInboxButtonSelector: string | undefined
}

type IntercomFunction = (method: method, ...args: unknown[]) => void

export type Intercom = IntercomFunction & IntercomApi
