import addBasicAuthHeader from './middleware/before-request/add-basic-auth-header'
import prepareHeaders from './middleware/after-response/prepare-headers'
import prepareResponse from './middleware/after-response/prepare-response'
import createInstance, { AllRequestOptions, RequestOptions, DEFAULT_REQUEST_TIMEOUT } from './request-client'
import type { ModifiedResponse } from './types'

export interface ResponseError extends Error {
  status?: number
}

const baseClient = createInstance({
  timeout: DEFAULT_REQUEST_TIMEOUT,
  headers: {
    'user-agent': 'Segment (Actions)'
  },
  beforeRequest: [
    // Automatically handle username/password -> basic auth header
    addBasicAuthHeader
  ],
  afterResponse: [prepareResponse, prepareHeaders]
})

export type RequestClient = ReturnType<typeof createRequestClient>

/**
 * Creates a request client instance with Segment's default configuration + custom options
 */
export default function createRequestClient(...requestOptions: AllRequestOptions[]) {
  let client = baseClient

  // TODO include `data` bundle in before/after hooks
  // TODO expose before/after hooks to destination definition and action definition?
  for (const options of requestOptions ?? []) {
    client = client.extend(options)
  }

  // Limit request client interface and handle basic auth scheme
  return <Data = unknown>(url: string, options?: RequestOptions) => {
    return client<ModifiedResponse<Data>>(url, options)
  }
}
