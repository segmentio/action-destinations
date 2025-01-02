export type UserConfig = {
  trackingServer?: string
  ingestServer?: string
  disableTextCapture: boolean
  secureCookie: boolean
}

type UserProperties = {
  [k: string]: unknown
}

type EventProperties = {
  [key: string]: unknown
}

export type HeapApi = {
  appid: string
  envId: string
  track: (eventName: string, eventProperties: EventProperties, library?: string) => void
  load: (envId: string, clientConfig?: UserConfig) => void
  loaded?: boolean
  config: UserConfig
  clientConfig?: Partial<UserConfig> & { shouldFetchServerConfig?: boolean }
  identify: (identity: string) => void
  addUserProperties: (properties: UserProperties) => void
}

// Define types for Heap methods
export type HeapMethods =
  | 'init'
  | 'startTracking'
  | 'stopTracking'
  | 'track'
  | 'resetIdentity'
  | 'identify'
  | 'identifyHashed'
  | 'getSessionId'
  | 'getUserId'
  | 'getIdentity'
  | 'addUserProperties'
  | 'addEventProperties'
  | 'removeEventProperty'
  | 'clearEventProperties'
  | 'addAccountProperties'
  | 'addAdapter'
  | 'addTransformer'
  | 'addTransformerFn'
  | 'onReady'
  | 'addPageviewProperties'
  | 'removePageviewProperty'
  | 'clearPageviewProperties'
  | 'trackPageview'
