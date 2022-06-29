import type { RequestOptions } from '@segment/actions-core'
import type { Settings } from './generated-types'

/**
 * Mirrors the ID type which isn't exported from the @segment/actions-core package root.
 */
type ID = string | null | undefined

/**
 * Parameters intended to be passed into a RequestClient.
 */
interface RequestParams {
  url: string
  options: RequestOptions
}

const apiBaseUrl = 'https://api.fullstory.com'

/**
 * Returns default {@link RequestParams} suitable for most FullStory HTTP API requests.
 *
 * @param settings Settings configured for the cloud mode destination.
 * @param relativeUrl The relative URL from the FullStory API domain root.
 */
const defaultRequestParams = (settings: Settings, relativeUrl: string): RequestParams => {
  return {
    url: `${apiBaseUrl}/${relativeUrl}`,
    options: {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${settings.apiKey}`
      }
    }
  }
}

/**
 * Returns the region specific {@link RequestParams} for the list operations HTTP API endpoint.
 *
 * @param settings Settings configured for the cloud mode destination.
 */
export const listOperationsRequestParams = (settings: Settings): RequestParams =>
  defaultRequestParams(settings, `operations/v1?limit=1`)

/**
 * Returns the region specific {@link RequestParams} for the set user properties HTTP API endpoint.
 *
 * @param settings Settings configured for the cloud mode destination.
 * @param userId The id of the user to update.
 * @param requestBody The request body containing user properties to set.
 */
export const setUserPropertiesRequestParams = (settings: Settings, userId: ID, requestBody: Object): RequestParams => {
  const defaultParams = defaultRequestParams(settings, `users/v1/individual/${userId}/customvars`)

  return {
    ...defaultParams,
    options: {
      ...defaultParams.options,
      method: 'post',
      body: JSON.stringify(requestBody)
    }
  }
}

/**
 * Returns the region specific {@link RequestParams} for the delete user HTTP API endpoint.
 *
 * @param settings Settings configured for the cloud mode destination.
 * @param userId The id of the user to delete.
 */
export const deleteUserRequestParams = (settings: Settings, userId: ID): RequestParams => {
  const defaultParams = defaultRequestParams(settings, `users/v1/individual/${userId}`)

  return {
    ...defaultParams,
    options: {
      ...defaultParams.options,
      method: 'delete'
    }
  }
}
