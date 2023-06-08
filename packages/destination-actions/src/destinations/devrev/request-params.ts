import type { RequestOptions } from '@segment/actions-core'
import type { Settings } from './generated-types'

/**
 * Paramters intended to be passed into a RequestClient.
 *
 */
interface RequestParams {
  url: string
  options: RequestOptions
}

const apiBaseUrl = 'https://api.dev.devrev-eng.ai'

/**
 * Returns default {@link RequestParams} suitable for DevRev API requests.
 *
 * @param settings Settings configured for the cloud mode destination.
 * @param relativeUrl The relative URL from the DevRev API domain root.
 *
 */
const defaultRequestParams = (settings: Settings, relativeUrl: string): RequestParams => {
  return {
    url: `${apiBaseUrl}/${relativeUrl}`,
    options: {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${settings.apiKey}`
      }
    }
  }
}

/**
 * Returns {@link RequestParams} for POST requests.
 * @param settings Settings configured for the cloud mode destination.
 * @param relativeUrl The relative URL from the DevRev API domain root.
 * @param data The data to send with the request.
 */
export const postRequestParams = (settings: Settings, relativeUrl: string): RequestParams => {
  const reqParams = defaultRequestParams(settings, relativeUrl)
  reqParams.options.method = 'post'
  return reqParams
}

export const getRequestParams = (settings: Settings, relativeUrl: string): RequestParams => {
  const reqParams = defaultRequestParams(settings, relativeUrl)
  reqParams.options.method = 'get'
  return reqParams
}

export const listPartIdsParams = (settings: Settings): RequestParams => {
  return getRequestParams(settings, 'parts.list')
}

export const createWorkParams = (
  settings: Settings,
  partId: string,
  title: string,
  description: string,
  assignTo?: string
): RequestParams => {
  const reqParams = postRequestParams(settings, 'works.create')
  reqParams.options.json = {
    applies_to_part: partId,
    title,
    body: description,
    owned_by: [assignTo],
    type: 'issue'
  }
  return reqParams
}
