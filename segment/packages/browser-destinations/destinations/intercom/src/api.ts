type method = 'trackEvent' | 'update'

type IntercomApi = {
  richLinkProperties: string[] | undefined
  appId: string
  activator: string | undefined
}

type IntercomFunction = (method: method, ...args: unknown[]) => void

export type Intercom = IntercomFunction & IntercomApi
