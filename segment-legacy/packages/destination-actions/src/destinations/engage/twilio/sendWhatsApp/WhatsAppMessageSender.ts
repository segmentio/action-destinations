/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Liquid as LiquidJs } from 'liquidjs'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'
import { PhoneMessageSender } from '../utils'
import { track } from '../../utils'

const phoneUtil = PhoneNumberUtil.getInstance()
const Liquid = new LiquidJs()

export class WhatsAppMessageSender extends PhoneMessageSender<Payload> {
  get supportedTemplateTypes(): string[] {
    throw new Error('Method not supported.')
  }
  getChannelType() {
    return 'whatsapp'
  }

  @track()
  async getBody(phone: string) {
    let parsedPhone

    try {
      // Defaulting to US for now as that's where most users will seemingly be. Though
      // any number already given in e164 format should parse correctly even with the
      // default region being US.
      parsedPhone = phoneUtil.parse(phone, 'US')
      parsedPhone = phoneUtil.format(parsedPhone, PhoneNumberFormat.E164)
      parsedPhone = `whatsapp:${parsedPhone}`
    } catch (e) {
      const underlyingError = e as Error
      throw new IntegrationError(
        'Phone number must be able to be formatted to e164 for whatsapp. ' + underlyingError.message,
        `INVALID_PHONE`,
        400
      )
    }

    if (!this.payload.contentSid) {
      throw new IntegrationError('A valid whatsApp Content SID was not provided.', `INVALID_CONTENT_SID`, 400)
    }

    const params: Record<string, string> = {
      ContentSid: this.payload.contentSid,
      From: this.payload.from,
      To: parsedPhone
    }
    const contentVariables = await this.getVariables()

    if (contentVariables) params['ContentVariables'] = contentVariables

    return new URLSearchParams(params)
  }

  @track({
    wrapIntegrationError: () => [
      `Unable to parse templating in content variables`,
      `Content variables templating parse failure`,
      400
    ]
  })
  private async getVariables(): Promise<string | null> {
    // contentVariables can be rendered to their respective values in the upstream actor
    // before they send it to this action.
    // to signify this behavior, traitsEnrichment will be passed as false by the upstream actor
    if (!this.payload.traitEnrichment && this.payload.contentVariables)
      return JSON.stringify(this.payload.contentVariables) ?? null
    if (!this.payload.contentVariables || !this.payload.traits) return null

    const profile = {
      profile: {
        traits: this.payload.traits
      }
    }

    const mapping: Record<string, string> = {}
    for (const [key, val] of Object.entries(this.payload.contentVariables)) {
      const parsed = await Liquid.parseAndRender(val as string, profile)
      if (parsed?.length) {
        mapping[key] = parsed
      }
    }

    return JSON.stringify(mapping)
  }
}
