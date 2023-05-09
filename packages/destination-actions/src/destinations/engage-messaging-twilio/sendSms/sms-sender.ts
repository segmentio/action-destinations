/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Liquid as LiquidJs } from 'liquidjs'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, PayloadValidationError } from '@segment/actions-core'
import { Logger, StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import { MessageSender, RequestFn } from '../utils/message-sender'

const Liquid = new LiquidJs()

interface ContentTemplateResponse {
  types: {
    [type: string]: {
      body: string
      media?: string[]
    }
  }
}

type Profile = {
  user_id: string | undefined
  phone: string
  traits: Payload['traits']
}

export class SmsMessageSender extends MessageSender<Payload> {
  constructor(
    readonly request: RequestFn,
    readonly payload: Payload,
    readonly settings: Settings,
    readonly statsClient: StatsClient | undefined,
    readonly tags: StatsContext['tags'],
    readonly logger: Logger | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly logDetails: {[key:string]: any} = {}
  ) {
    super(request, payload, settings, statsClient, tags, logger, logDetails)
  }

  getExternalId = () => this.payload.externalIds?.find(({ type }) => type === 'phone')

  getBody = async (phone: string) => {
    if (!this.payload.body && !this.payload.contentSid) {
      this.logger?.error(
        `TE Messaging: Unable to process SMS, no body provided and no content sid provided - ${this.settings.spaceId}`
      )
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
      const data = await this.getContentTemplate()
      const parsed = await this.parseContent(this.getUnparsedContent(data), profile)
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

  private getProfileTraits = async () => {
    if (!this.payload.userId) {
      this.logger?.error(
        `TE Messaging: Unable to process SMS, no userId provided and no traits provided - ${this.settings.spaceId}`
      )
      throw new IntegrationError(
        'Unable to process sms, no userId provided and no traits provided',
        'Invalid parameters',
        400
      )
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
      this.tags.push(`profile_status_code:${response.status}`)
      this.statsClient?.incr('actions-personas-messaging-twilio.profile_invoked', 1, this.tags)
      const body = await response.json()
      return body.traits
    } catch (error: unknown) {
      this.statsClient?.incr('actions-personas-messaging-twilio.profile_error', 1, this.tags)
      this.logger?.error(`TE Messaging: SMS profile traits request failure - ${this.settings.spaceId} - [${error}]`)
      throw new IntegrationError('Unable to get profile traits for SMS message', 'SMS trait fetch failure', 500)
    }
  }

  private getContentTemplate = async () => {
    const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
      'base64'
    )

    try {
      this.logger?.info("TE Messaging: Get content template from Twilio by ContentSID", JSON.stringify(this.logDetails))

      const response = await this.request(`https://content.twilio.com/v1/Content/${this.payload.contentSid}`, {
        method: 'GET',
        headers: {
          authorization: `Basic ${twilioToken}`
        }
      })
      const data = await response.json()
      return data as ContentTemplateResponse
    } catch (error) {
      this.tags.push('reason:get_content_template')
      this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
      this.logger?.error(
        `TE Messaging: SMS failed request to fetch content template from Twilio Content API - ${this.settings.spaceId}, ${JSON.stringify(error)})}`,
        JSON.stringify(this.logDetails)
      )
      throw new IntegrationError('Unable to fetch content template', 'Twilio Content API request failure', 500)
    }
  }

  private getUnparsedContent = (data: ContentTemplateResponse): ContentTemplateResponse['types'][string] => {
    if (!data.types) {
      this.logger?.error(
        `TE Messaging: SMS template from Twilio Content API does not contain a template type - ${
          this.settings.spaceId
        } - [${JSON.stringify(data)}]`
      )
      throw new IntegrationError(
        'Unexpected response from Twilio Content API',
        `SMS template does not contain a template type`,
        500
      )
    }
    const type = Object.keys(data.types)[0] // eg 'twilio/text', 'twilio/media', etc
    if (type === 'twilio/text' || type === 'twilio/media') {
      return { body: data.types[type].body, media: data.types[type].media }
    } else {
      this.logger?.error(`TE Messaging: SMS unsupported content template type '${type}' - ${this.settings.spaceId}`)
      throw new IntegrationError(
        'Unsupported content type',
        `Sending templates with '${type}' content type is not supported by SMS`,
        400
      )
    }
  }

  private async parseContent(
    content: ContentTemplateResponse['types'][string],
    profile: Profile
  ): Promise<ContentTemplateResponse['types'][string]> {
    try {
      return {
        body: await Liquid.parseAndRender(content.body, { profile }),
        media: await Promise.all(content.media?.map((media) => Liquid.parseAndRender(media, { profile })) || [])
      }
    } catch (error: unknown) {
      this.logger?.error(`TE Messaging: SMS templating parse failure - ${this.settings.spaceId} - [${error}]`)
      throw new IntegrationError(`Unable to parse templating in SMS`, `SMS templating parse failure`, 400)
    }
  }
}
