import { ANGLER_AI_API_VERSION } from '../versioning-info'

export const baseURL = 'https://data.getangler.ai'

export const testEndpoint = () => {
  return `/${ANGLER_AI_API_VERSION}/me`
}

export const eventsEndpoint = (workspaceId: string) => {
  return `/${ANGLER_AI_API_VERSION}/workspaces/${workspaceId}/events`
}

export const ordersEndpoint = (workspaceId: string) => {
  return `/${ANGLER_AI_API_VERSION}/workspaces/${workspaceId}/data/orders`
}

export const customersEndpoint = (workspaceId: string) => {
  return `/${ANGLER_AI_API_VERSION}/workspaces/${workspaceId}/data/customers`
}

export const lineItemsEndpoint = (workspaceId: string) => {
  return `/${ANGLER_AI_API_VERSION}/workspaces/${workspaceId}/data/line_items`
}

export const productsEndpoint = (workspaceId: string) => {
  return `/${ANGLER_AI_API_VERSION}/workspaces/${workspaceId}/data/products`
}

export const privacyEndpoint = (workspaceId: string) => {
  return `/${ANGLER_AI_API_VERSION}/workspaces/${workspaceId}/privacy/redact`
}
