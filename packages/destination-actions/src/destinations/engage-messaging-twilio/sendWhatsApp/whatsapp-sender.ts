/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Liquid as LiquidJs } from 'liquidjs'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { MessageSender } from '../utils/message-sender'
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'

const phoneUtil = PhoneNumberUtil.getInstance()
const Liquid = new LiquidJs()

export class WhatsAppMessageSender extends MessageSender<Payload> {

  getChannelType(){
    return 'whatsapp'
  }

  async getBody(phone: string){
    let parsedPhone

    try {
      // Defaulting to US for now as that's where most users will seemingly be. Though
      // any number already given in e164 format should parse correctly even with the
      // default region being US.
      parsedPhone = phoneUtil.parse(phone, 'US')
      parsedPhone = phoneUtil.format(parsedPhone, PhoneNumberFormat.E164)
      parsedPhone = `whatsapp:${parsedPhone}`
    } catch (error: unknown) {
      this.tags.push('type:invalid_phone_e164')
      this.logError(`WhatsApp invalid phone number - ${this.settings.spaceId} - [${error}]`)
      this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
      throw new IntegrationError(
        'The string supplied did not seem to be a phone number. Phone number must be able to be formatted to e164 for whatsapp.',
        `INVALID_PHONE`,
        400
      )
    }

    if (!this.payload.contentSid) {
      this.logError(`A valid WhatsApp Content SID was not provided - ${this.settings.spaceId}`)
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

  private getVariables = async (): Promise<string | null> => {
    try {
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
    } catch (error: unknown) {
      this.logError(
        `Failed to parse WhatsApp template with content variables - ${this.settings.spaceId} - [${error}]`
      )
      throw new IntegrationError(
        `Unable to parse templating in content variables`,
        `Content variables templating parse failure`,
        400
      )
    }
  }
}
