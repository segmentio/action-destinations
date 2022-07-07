type method = 'trackEvent' | 'update'

type IntercomApi = {
  booted: boolean
  richLinkProperties: string[]
  appId: string
}

type IntercomFunction = (method: method, ...args: unknown[]) => void

export type Intercom = IntercomFunction & IntercomApi
