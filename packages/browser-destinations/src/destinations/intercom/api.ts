type method = 'trackEvent' | 'boot'

type IntercomApi = {
  booted: boolean
  richLinkProperties: string[] | undefined
  appId: string
}

type IntercomFunction = (method: method, ...args: unknown[]) => void

export type Intercom = IntercomFunction & IntercomApi
