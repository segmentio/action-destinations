/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { Payload } from './generated-types'
import { PayloadValidationError } from '@segment/actions-core'
import { PhoneMessage } from '../utils'
import { track } from '../../utils'

export class SmsMessageSender extends PhoneMessage<Payload> {
  protected supportedTemplateTypes: string[] = ['twilio/text', 'twilio/media']

  @track()
  async getBody(phone: string): Promise<URLSearchParams> {
    if (!this.payload.body && !this.payload.contentSid) {
      throw new PayloadValidationError('Unable to process sms, no body provided and no content sid provided')
    }

    // TODO: GROW-259 remove this when we can extend the request
    // and we no longer need to call the profiles API first
    let traits
    if (this.payload.traitEnrichment) {
      traits = this.payload?.traits ? this.payload?.traits : {}
    } else {
      traits = await this.getProfileTraits()
    }

    const profile = {
      user_id: this.payload.userId ?? undefined,
      phone,
      traits
    }

    let parsedBody: string
    let parsedMedia: string[] | undefined = []

    if (this.payload.contentSid) {
      const data = await this.getContentTemplateTypes()
      const parsed = await this.parseContent(data, profile)
      parsedBody = parsed.body
      parsedMedia = parsed.media
    } else {
      const parsed = await this.parseContent(
        { body: this.payload.body ?? '', media: this.payload.media ?? [] },
        profile
      )
      parsedBody = parsed.body
      parsedMedia = parsed.media
    }

    const body = new URLSearchParams({
      Body: parsedBody,
      From: this.payload.from,
      To: phone,
      ShortenUrls: 'true'
    })

    parsedMedia?.forEach((media) => {
      body.append('MediaUrl', media)
    })

    return body
  }

  getChannelType() {
    return 'sms'
  }

  isValidExternalId(externalId: NonNullable<Payload['externalIds']>[number]): boolean {
    if (externalId.type !== 'phone') {
      return false
    }
    return !externalId.channelType || externalId.channelType.toLowerCase() === this.getChannelType()
  }

  @track()
  private async getProfileTraits() {
    if (!this.payload.userId) {
      throw new PayloadValidationError('Unable to process sms, no userId provided and no traits provided')
    }
    try {
      const { region, profileApiEnvironment, spaceId, profileApiAccessToken } = this.settings
      const domainName = region === 'eu-west-1' ? 'profiles.euw1.segment' : 'profiles.segment'
      const topLevelName = profileApiEnvironment === 'production' ? 'com' : 'build'
      const response = await this.request(
        `https://${domainName}.${topLevelName}/v1/spaces/${spaceId}/collections/users/profiles/user_id:${encodeURIComponent(
          this.payload.userId
        )}/traits?limit=200`,
        {
          headers: {
            authorization: `Basic ${Buffer.from(profileApiAccessToken + ':').toString('base64')}`,
            'content-type': 'application/json'
          }
        }
      )
      const body = await response.json()
      return body.traits
    } catch (e) {
      this.rethrowIntegrationError(e, () => [
        'Unable to get profile traits for SMS message',
        'SMS trait fetch failure',
        500
      ])
    }
  }
}
