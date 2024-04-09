export type AuthRepsponseType = {
  iat: number
  exp: number
  sub: string
  scopes: string
  iss: string
  jti: string
}

export const baseURL = 'https://data.getangler.ai'

export const testEnpoint = () => {
  return `${baseURL}/v1/me`
}

export const eventsEndpoint = (workspaceId: string) => {
  return `${baseURL}/v1/workspaces/${workspaceId}/events`
}

export const ordersEndpoint = (workspaceId: string) => {
  return `${baseURL}/v1/workspaces/${workspaceId}/data/orders`
}

export const customersEndpoint = (workspaceId: string) => {
  return `${baseURL}/v1/workspaces/${workspaceId}/data/orders`
}

export const lineItemsEndpoint = (workspaceId: string) => {
  return `${baseURL}/v1/workspaces/${workspaceId}/data/line_items`
}

export const productsEndpoint = (workspaceId: string) => {
  return `${baseURL}/v1/workspaces/${workspaceId}/data/products`
}

export const privacyEndpoint = (workspaceId: string) => {
  return `${baseURL}/v1/workspaces/${workspaceId}/privacy/redact`
}
