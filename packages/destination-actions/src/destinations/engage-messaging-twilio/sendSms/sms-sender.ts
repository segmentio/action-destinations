/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Liquid as LiquidJs } from 'liquidjs'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import { MessageSender, RequestFn } from '../utils/message-sender'

const Liquid = new LiquidJs()

export class SmsMessageSender extends MessageSender<Payload> {
  constructor(
    readonly request: RequestFn,
    readonly payload: Payload,
    readonly settings: Settings,
    readonly statsClient: StatsClient | undefined,
    readonly tags: StatsContext['tags'] | undefined
  ) {
    super(request, payload, settings, statsClient, tags)
  }

  getExternalId = () => this.payload.externalIds?.find(({ type }) => type === 'phone')

  getBody = async (phone: string) => {
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

    let parsedBody

    try {
      parsedBody = await Liquid.parseAndRender(this.payload.body, { profile })
    } catch (error: unknown) {
      throw new IntegrationError(`Unable to parse templating in SMS`, `SMS templating parse failure`, 400)
    }

    const body = new URLSearchParams({
      Body: parsedBody,
      From: this.payload.from,
      To: phone
    })

    return body
  }

  private getProfileTraits = async () => {
    if (!this.payload.userId) {
      throw new IntegrationError(
        'Unable to process sms, no userId provided and no traits provided',
        'Invalid parameters',
        400
      )
    }
    try {
      const endpoint = `https://profiles.segment.${
        this.settings.profileApiEnvironment === 'production' ? 'com' : 'build'
      }`
      const response = await this.request(
        `${endpoint}/v1/spaces/${this.settings.spaceId}/collections/users/profiles/user_id:${encodeURIComponent(
          this.payload.userId
        )}/traits?limit=200`,
        {
          headers: {
            authorization: `Basic ${Buffer.from(this.settings.profileApiAccessToken + ':').toString('base64')}`,
            'content-type': 'application/json'
          }
        }
      )
      this.tags?.push(`profile_status_code:${response.status}`)
      this.statsClient?.incr('actions-personas-messaging-twilio.profile_invoked', 1, this.tags)
      const body = await response.json()
      return body.traits
    } catch (error: unknown) {
      this.statsClient?.incr('actions-personas-messaging-twilio.profile_error', 1, this.tags)
      throw new IntegrationError('Unable to get profile traits for SMS message', 'SMS trait fetch failure', 500)
    }
  }
}
