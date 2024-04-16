/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { Payload } from './generated-types'
import { PayloadValidationError } from '@segment/actions-core'
import { PhoneMessageSender } from '../utils'
import { ExtId, track } from '../../utils'

export class SmsMessageSender extends PhoneMessageSender<Payload> {
  supportedTemplateTypes: string[] = ['twilio/text', 'twilio/media']

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

  isSupportedExternalId(externalId: ExtId<Payload>): boolean {
    if (externalId.type !== 'phone') {
      return false
    }
    return !externalId.channelType || externalId.channelType.toLowerCase() === this.getChannelType()
  }
}
