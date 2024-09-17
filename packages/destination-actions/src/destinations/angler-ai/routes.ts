export const baseURL = 'https://data.getangler.ai'

export const testEndpoint = () => {
  return `/v1/me`
}

export const eventsEndpoint = (workspaceId: string) => {
  return `/v1/workspaces/${workspaceId}/events`
}

export const ordersEndpoint = (workspaceId: string) => {
  return `/v1/workspaces/${workspaceId}/data/orders`
}

export const customersEndpoint = (workspaceId: string) => {
  return `/v1/workspaces/${workspaceId}/data/customers`
}

export const lineItemsEndpoint = (workspaceId: string) => {
  return `/v1/workspaces/${workspaceId}/data/line_items`
}

export const productsEndpoint = (workspaceId: string) => {
  return `/v1/workspaces/${workspaceId}/data/products`
}

export const privacyEndpoint = (workspaceId: string) => {
  return `/v1/workspaces/${workspaceId}/privacy/redact`
}
