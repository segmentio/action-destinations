import { RequestOptions, IntegrationError, HTTPError } from '@segment/actions-core'
import { StateContext } from '@segment/actions-core/destination-kit'
import type { Settings } from './generated-types'
import type { Payload } from './triggerStudioFlow/generated-types'
interface ExternalId {
  id: string
  type: string
  source_id: string
  collection: string
  created_at: string
  encoding: string
}

type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>
export interface TwilioError extends HTTPError {
  response: Response & {
    data: {
      status: number
      message: string
      code: string
    }
  }
}

export const STUDIO_BASE_URL = 'https://studio.twilio.com'
export const PROFILE_API_BASE_URL = 'https://profiles.segment.com'

// Default cooldown period in seconds
export const DEFAULT_COOLING_OFF_PERIOD = 60

// Extracts the latest external Id based on the fetched list of external Ids
export const getToAddressField = async (request: RequestFn, settings: Settings, payload: Payload) => {
  const externalIds = await fetchProfileExternalIds(request, settings, payload.userId!, payload.anonymousId!)
  if (externalIds.length <= 0) {
    return false
  }
  const latestId = externalIds.reduce((acc, current) => {
    return new Date(acc.created_at) > new Date(current.created_at) ? acc : current
  })
  return latestId?.id
}

// Fetches the external Ids for a Segment profile
export const fetchProfileExternalIds = async (
  request: RequestFn,
  settings: Settings,
  userId: string,
  anonymousId: string
): Promise<ExternalId[]> => {
  try {
    // NOTE: Not falling back to the anonymousId for now as this action is going to use ID Sync Feature in future to
    // directly get the phone external ID in the payload. This API call won't be required anymore.
    // For the private Beta, there is no requirement to fallback to the anonymousId.
    // Not using the region based Profile API call as well for the above mentioned reason.
    const identifier = userId ? `user_id:${userId}` : `anonymous_id:${anonymousId}`
    const response = await request(
      `${PROFILE_API_BASE_URL}/v1/spaces/${settings.spaceId}/collections/users/profiles/${identifier}/external_ids?include=phone`,
      {
        headers: {
          authorization: `Basic ${Buffer.from(settings.profileApiAccessToken + ':').toString('base64')}`,
          'content-type': 'application/json'
        }
      }
    )
    const body = await response.json()
    return body.data
  } catch (error: unknown) {
    throw new IntegrationError(
      'Unable to trigger Studio Flow. Fetching phone external Id failed.',
      'Profile fetch API failure',
      500
    )
  }
}

// Decides whether to trigger the flow based on the cache.
export const shouldSendToStudio = (cacheKey: string, stateContext: StateContext, coolingOffPeriod: number): boolean => {
  if (stateContext?.getRequestContext?.(cacheKey)) return false
  stateContext?.setResponseContext?.(cacheKey, cacheKey, { second: coolingOffPeriod || DEFAULT_COOLING_OFF_PERIOD })
  return true
}
