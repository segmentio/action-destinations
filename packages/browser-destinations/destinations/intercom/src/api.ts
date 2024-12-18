type method = 'trackEvent' | 'update'

type IntercomApi = {
  richLinkProperties: string[] | undefined
  appId: string
  custom_launcher_selector: string | undefined
}

type IntercomFunction = (method: method, ...args: unknown[]) => void

export type Intercom = IntercomFunction & IntercomApi
