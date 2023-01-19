/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Liquid as LiquidJs } from 'liquidjs'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { RequestFn, MessageSender } from '../utils/message-sender'
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'
import { StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'

const phoneUtil = PhoneNumberUtil.getInstance()
const Liquid = new LiquidJs()

export class WhatsAppMessageSender extends MessageSender<Payload> {
  constructor(
    readonly request: RequestFn,
    readonly payload: Payload,
    readonly settings: Settings,
    readonly statsClient: StatsClient | undefined,
    readonly tags: StatsContext['tags'] | undefined
  ) {
    super(request, payload, settings, statsClient, tags)
  }

  getBody = async (phone: string) => {
    let parsedPhone

    try {
      // Defaulting to US for now as that's where most users will seemingly be. Though
      // any number already given in e164 format should parse correctly even with the
      // default region being US.
      parsedPhone = phoneUtil.parse(phone, 'US')
      parsedPhone = phoneUtil.format(parsedPhone, PhoneNumberFormat.E164)
      parsedPhone = `whatsapp:${parsedPhone}`
    } catch (error: unknown) {
      this.tags?.push('type:invalid_phone_e164')
      this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
      throw new IntegrationError(
        'The string supplied did not seem to be a phone number. Phone number must be able to be formatted to e164 for whatsapp.',
        `INVALID_PHONE`,
        400
      )
    }

    if (!this.payload.contentSid) {
      // TODO: ASK for the appropriate errors to throw
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

  /**
   * This method takes a JSON string of  {[key: number]: liquidJs} and parses the liquidJs to contain the trait value
   */
  getVariables = async (): Promise<string | null> => {
    if (!this.payload.contentVariables || !this.payload.traits) return null

    const variables = JSON.parse(this.payload.contentVariables)
    const profile = {
      profile: {
        traits: this.payload.traits
      }
    }

    const mapping: Record<string, string> = {}
    try {
      for (const [key, val] of Object.entries(variables)) {
        mapping[key] = await Liquid.parseAndRender(val as string, profile)
      }
      return JSON.stringify(mapping)
    } catch (error: unknown) {
      throw new IntegrationError(
        `Unable to parse templating in content variables`,
        `Content variables templating parse failure`,
        400
      )
    }
  }
}
