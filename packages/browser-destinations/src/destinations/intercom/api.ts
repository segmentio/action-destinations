type method = 'trackEvent' | 'boot'

export type Intercom = (method: method, ...args: unknown[]) => void
