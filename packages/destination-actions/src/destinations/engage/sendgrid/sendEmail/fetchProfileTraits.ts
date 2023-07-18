import { IntegrationError, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Logger, StatsClient } from '@segment/actions-core/destination-kit'
import { getProfileApiEndpoint } from './getProfileApiEndpoint'
import { Region } from './Region'

export const fetchProfileTraits = async (
  request: RequestClient,
  settings: Settings,
  profileId: string,
  statsClient: StatsClient | undefined,
  tags: string[],
  logger?: Logger | undefined
): Promise<Record<string, string>> => {
  try {
    const endpoint = getProfileApiEndpoint(settings.profileApiEnvironment, settings.region as Region)
    const response = await request(
      `${endpoint}/v1/spaces/${settings.spaceId}/collections/users/profiles/user_id:${profileId}/traits?limit=200`,
      {
        headers: {
          authorization: `Basic ${Buffer.from(settings.profileApiAccessToken + ':').toString('base64')}`,
          'content-type': 'application/json'
        }
      }
    )
    tags.push(`profile_status_code:${response.status}`)
    statsClient?.incr('actions-personas-messaging-sendgrid.profile_invoked', 1, tags)

    const body = await response.json()
    return body.traits
  } catch (error) {
    logger?.error(`TE Messaging: Email profile traits request failure - ${settings.spaceId} - [${error}]`)
    tags.push('reason:profile_error')
    statsClient?.incr('actions-personas-messaging-sendgrid.error', 1, tags)
    throw new IntegrationError('Unable to get profile traits for the email message', 'Email trait fetch failure', 500)
  }
}
