import { IntegrationError } from '@segment/actions-core'
import { getProfileApiEndpoint } from './getProfileApiEndpoint'
import { Region } from './Region'
import { SendEmailPerformer } from './SendEmailPerformer'

export async function fetchProfileTraits(this: SendEmailPerformer, profileId: string): Promise<Record<string, string>> {
  try {
    const endpoint = getProfileApiEndpoint(this.settings.profileApiEnvironment, this.settings.region as Region)
    const response = await this.request(
      `${endpoint}/v1/spaces/${this.settings.spaceId}/collections/users/profiles/user_id:${profileId}/traits?limit=200`,
      {
        headers: {
          authorization: `Basic ${Buffer.from(this.settings.profileApiAccessToken + ':').toString('base64')}`,
          'content-type': 'application/json'
        }
      }
    )
    this.tags.push(`profile_status_code:${response.status}`)
    this.statsClient.incr('actions-personas-messaging-sendgrid.profile_invoked', 1)

    const body = await response.json()
    return body.traits
  } catch (error) {
    this.logger.error(`profile traits request failure - ${this.settings.spaceId} - [${error}]`)
    this.tags.push('reason:profile_error')
    this.statsClient.incr('actions-personas-messaging-sendgrid.error', 1)
    throw new IntegrationError('Unable to get profile traits for the email message', 'Email trait fetch failure', 500)
  }
}
