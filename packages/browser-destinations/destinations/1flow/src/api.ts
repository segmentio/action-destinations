type method = 'track' | 'identify'

type _1FlowApi = {
  richLinkProperties: string[] | undefined
  appId: string
  activator: string | undefined
}

type _1FlowFunction = (method: method, ...args: unknown[]) => void

export type _1Flow = _1FlowFunction & _1FlowApi
