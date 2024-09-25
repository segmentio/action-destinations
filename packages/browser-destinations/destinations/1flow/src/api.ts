type method = 'track' | 'identify'

type _1FlowApi = {
  richLinkProperties: string[] | undefined
  activator: string | undefined
  projectApiKey: string
}

type _1FlowFunction = (method: method, ...args: unknown[]) => void

export type _1flow = _1FlowFunction & _1FlowApi
