type method = 'trackEvent' | 'boot'

type IntercomApi = {
  booted: boolean
}

type IntercomFunction = (method: method, ...args: unknown[]) => void

export type Intercom = IntercomFunction & IntercomApi
