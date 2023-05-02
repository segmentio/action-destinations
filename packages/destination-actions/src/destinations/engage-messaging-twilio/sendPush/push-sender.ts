/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Liquid as LiquidJs } from 'liquidjs'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { Logger, StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import { getTwilioContentTemplate } from '../utils/content'
import { ContentTemplateResponse, RequestFn } from '../utils/types'

const Liquid = new LiquidJs()

type Content = ContentTemplateResponse['types'][string] & { title?: string }

export class PushSender {
  constructor(
    readonly request: RequestFn,
    readonly payload: Payload,
    readonly settings: Settings,
    readonly statsClient: StatsClient | undefined,
    readonly tags: StatsContext['tags'],
    readonly logger: Logger | undefined
  ) {}

  // TODO: sendBatch = async () => {}

  send = async () => {
    const recipients = this.payload.externalIds?.filter(
      (extId) =>
        extId.subscriptionStatus?.toLowerCase() === 'subscribed' &&
        ['ios.push_token', 'android.push_token'].includes(extId.type?.toLowerCase() || '')
    )
    // do we want to emit a stat for each subscription/unsubscription/invalid subscription value?
    // when no devices are capable of receiving a push
    if (!recipients?.length) {
      this.statsClient?.incr('actions-personas-messaging-twilio.notsubscribed', 1, this.tags)
      return
    }

    const { requestBody, customData } = await this.getBody()
    const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
      'base64'
    )

    // we send a request for each individual subscribed device because the delivery webhook callback does not include the push token/external id value
    // this is a limitation that will be handled post beta
    for (const recipient of recipients) {
      const webhookUrl = this.getWebhookUrlWithParams(recipient.type, recipient.id)

      try {
        const body = new URLSearchParams(requestBody)

        if (/ios.push_token/i.test(recipient?.type || '')) {
          body.append(
            'Recipients',
            JSON.stringify({
              apn: [{ addr: recipient.id }]
            })
          )
        } else {
          body.append(
            'Recipients',
            JSON.stringify({
              fcm: [{ addr: recipient.id }]
            })
          )
        }

        body.append(
          'CustomData',
          JSON.stringify({
            ...customData,
            __segment_internal_external_id_key__: recipient.type,
            __segment_internal_external_id_value__: recipient.id
          })
        )
        body.append('Recipients', JSON.stringify(recipient))
        if (webhookUrl) {
          body.append('DeliveryCallbackUrl', webhookUrl)
        }

        const response = await this.request(
          `https://push.ashburn.us1.twilio.com/v1/Services/${this.payload.from}/Notifications`,
          {
            method: 'POST',
            headers: {
              authorization: `Basic ${twilioToken}`
            },
            body
          }
        )

        this.tags.push(`twilio_status_code:${response.status}`)
        this.statsClient?.incr('actions-personas-messaging-twilio.response', 1, this.tags)

        return response
      } catch (error: any) {
        this.logger?.error(`TE Messaging: Push failed to send - ${error.message}`)
        this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
        // on unexpected fail, do not block rest of phones from receiving push notification
      }
    }

    if (this.payload.eventOccurredTS != undefined) {
      this.statsClient?.histogram(
        'actions-personas-messaging-twilio.eventDeliveryTS',
        Date.now() - new Date(this.payload.eventOccurredTS).getTime(),
        this.tags
      )
    }
  }

  private getBody = async (): Promise<{
    requestBody: URLSearchParams
    customData: object
  }> => {
    let content: ContentTemplateResponse['types'][string]

    try {
      const template = await getTwilioContentTemplate(
        this.payload.contentSid,
        this.settings.twilioApiKeySID,
        this.settings.twilioApiKeySecret,
        this.request
      )

      const type = Object.keys(template.types)[0]
      if (type !== 'twilio/text' && type !== 'twilio/media') {
        this.logger?.error(`TE Messaging: Push unsupported content template type '${type}' - ${this.settings.spaceId}`)
        throw new IntegrationError(
          `Sending templates with '${type}' content type is not supported by Push`,
          'Unsupported content type',
          400
        )
      }
      content = template.types[type]
    } catch (error) {
      this.tags.push('reason:get_content_template')
      this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
      this.logger?.error(
        `TE Messaging: Push failed request to fetch content template from Twilio Content API - ${this.settings.spaceId} - [${error}]`
      )
      throw new IntegrationError('Unable to fetch content template', 'Twilio Content API request failure', 500)
    }

    const parsedContent = await this.parseContent({
      ...content,
      title: this.payload.title
    })

    try {
      const customData: Record<string, any> = {
        ...this.payload.customArgs,
        space_id: this.settings.spaceId
      }
      const requestBody = new URLSearchParams({
        Body: parsedContent.body
        // Priority: undefined,
        // Action: undefined,
      })

      if (parsedContent.title?.length) {
        requestBody.append('Title', parsedContent.title)
      }

      if (parsedContent.media?.length) {
        customData['images'] = parsedContent.media
      }

      return { requestBody, customData }
    } catch (error) {
      this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
      this.logger?.error(`TE Messaging: Push failed to construct request body - [${error}]`)
      throw new IntegrationError('Unable to construct request body', 'Twilio Request Body Failure', 400)
    }
  }

  private async parseContent(content: Content): Promise<Content> {
    const profile = { profile: { traits: this.payload.traits } }
    try {
      return {
        title: await Liquid.parseAndRender(content.title || '', profile),
        body: await Liquid.parseAndRender(content.body, profile),
        media: await Promise.all(content.media?.map((media) => Liquid.parseAndRender(media, profile)) || [])
      }
    } catch (error: unknown) {
      this.logger?.error(`TE Messaging: Push templating parse failure - ${this.settings.spaceId} - [${error}]`)
      throw new IntegrationError(`Unable to parse templating in Push`, `Push templating parse failure`, 400)
    }
  }

  private getWebhookUrlWithParams(externalIdType?: string, externalIdValue?: string): string | null {
    const webhookUrl = this.settings.webhookUrl
    const connectionOverrides = this.settings.connectionOverrides
    const customArgs: Record<string, string | undefined> = {
      ...this.payload.customArgs,
      space_id: this.settings.spaceId,
      __segment_internal_external_id_key__: externalIdType,
      __segment_internal_external_id_value__: externalIdValue
    }

    if (webhookUrl && customArgs) {
      // Webhook URL parsing has a potential of failing. I think it's better that
      // we fail out of any invocation than silently not getting analytics
      // data if that's what we're expecting.
      const webhookUrlWithParams = new URL(webhookUrl)
      for (const key of Object.keys(customArgs)) {
        webhookUrlWithParams.searchParams.append(key, String(customArgs[key]))
      }

      webhookUrlWithParams.hash = connectionOverrides || 'rp=all&rc=5'

      return webhookUrlWithParams.toString()
    }

    return null
  }
}
