import { ExtId, MessageSendPerformer } from '../../utils'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Profile } from '../Profile'
import { Liquid as LiquidJs } from 'liquidjs'

import { IntegrationError, RequestOptions } from '@segment/actions-core'
import { ApiLookupConfig, apiLookupLiquidKey, performApiLookup } from '../previewApiLookup'
import { insertEmailPreviewText } from './insertEmailPreviewText'
import cheerio from 'cheerio'
import { isRestrictedDomain } from './isRestrictedDomain'
import { getProfileApiEndpoint } from './getProfileApiEndpoint'
import { Region } from './Region'
import { UnlayerResponse } from './UnlayerResponse'

export const EXTERNAL_ID_KEY = 'email'

export const Liquid = new LiquidJs()

export class SendEmailPerformer extends MessageSendPerformer<Settings, Payload> {
  getIntegrationStatsName(): string {
    return 'actions_personas_messaging_sendgrid'
  }

  getChannelType(): string {
    return 'email'
  }

  getDefaultSettingsRegion() {
    return 'us-west-2'
  }

  isSupportedExternalId(externalId: ExtId<Payload>): boolean {
    return externalId.type === 'email'
  }

  isExternalIdSubscribed(extId: ExtId<Payload>) {
    const bypass_subscription = this.payload.byPassSubscription !== undefined && this.payload.byPassSubscription
    if (bypass_subscription) {
      this.currentOperation?.logs.push('Bypassing subscription')
      return true
    }

    const isSubscribed = super.isExternalIdSubscribed(extId)
    if (!isSubscribed) return isSubscribed // may be undefined => as invalid

    if (!this.payload.groupId) return isSubscribed

    const recepientGroup = extId.groups?.find((g) => g.id === this.payload.groupId)
    if (!recepientGroup) {
      //statsClient?.incr('actions-personas-messaging-sendgrid.group_notfound', 1, tags)
      return false
    }
    if (!recepientGroup.isSubscribed) {
      //statsClient?.incr('actions-personas-messaging-sendgrid.group_notsubscribed', 1, tags)
      return false
    }

    return true
  }

  getRecepients(): ExtId<Payload>[] {
    //if toEmail specified => send test email requested
    if (this.payload.toEmail)
      return [
        {
          id: this.payload.toEmail,
          type: 'email',
          groups: [
            {
              id: this.payload.groupId
            }
          ]
        }
      ]
    // only email to the first found subscribed email id
    const res = super.getRecepients()
    if (res.length > 0) return [res[0]]
    return res
  }

  async parseTemplating(
    content: string,
    liquidData: {
      profile: Profile
      [apiLookupLiquidKey]?: Record<string, unknown>
    },
    contentType: string
  ) {
    try {
      const parsedContent = await Liquid.parseAndRender(content, liquidData)
      return parsedContent
    } catch (error) {
      // this.tags.push('reason:parse_templating')
      // this.statsClient.incr('actions-personas-messaging-sendgrid.error', 1)
      throw new IntegrationError(
        `Unable to parse templating in email ${contentType}`,
        `${contentType} templating parse failure`,
        400
      )
    }
  }
  async sendToRecepient(emailProfile: ExtId<Payload>) {
    let traits
    if (this.payload.traitEnrichment) {
      traits = this.payload?.traits ? this.payload?.traits : JSON.parse('{}')
    } else {
      if (!this.payload.userId) {
        this.tags.push('reason:missing_user_id')
        throw new IntegrationError(
          'Unable to process email, no userId provided and trait enrichment disabled',
          'Invalid parameters',
          400
        )
      }
      traits = await this.fetchProfileTraits(this.payload.userId)
    }

    const profile: Profile = {
      email: emailProfile?.id,
      traits
    }

    const toEmail = profile.email

    if (!toEmail) {
      return
    }

    if (isRestrictedDomain(toEmail)) {
      this.tags.push('reason:restricted_domain')
      throw new IntegrationError(
        'Emails with gmailx.com, yahoox.com, aolx.com, and hotmailx.com domains are blocked.',
        'Invalid input',
        400
      )
    }

    let name
    if (traits.first_name && traits.last_name) {
      name = `${traits.first_name} ${traits.last_name}`
    } else if (traits.firstName && traits.lastName) {
      name = `${traits.firstName} ${traits.lastName}`
    } else if (traits.name) {
      name = traits.name
    } else {
      name = traits.first_name || traits.last_name || traits.firstName || traits.lastName || 'User'
    }

    const bcc = JSON.parse(this.payload.bcc ?? '[]')
    const [parsedSubject, apiLookupData] = await Promise.all([
      this.parseTemplating(this.payload.subject, { profile }, 'Subject'),
      this.performApiLookups(this.payload.apiLookups, profile)
    ])

    let parsedBodyHtml

    if (this.payload.bodyUrl && this.settings.unlayerApiKey) {
      const { content: body } = await this.request(this.payload.bodyUrl, { method: 'GET', skipResponseCloning: true })
      const bodyHtml = this.payload.bodyType === 'html' ? body : await this.generateEmailHtml(body)
      parsedBodyHtml = await this.parseTemplating(bodyHtml, { profile, [apiLookupLiquidKey]: apiLookupData }, 'Body')
    } else {
      parsedBodyHtml = await this.parseTemplating(
        this.payload.bodyHtml ?? '',
        { profile, [apiLookupLiquidKey]: apiLookupData },
        'Body HTML'
      )
    }

    // only include preview text in design editor templates
    if (this.payload.bodyType === 'design' && this.payload.previewText) {
      const parsedPreviewText = await this.parseTemplating(this.payload.previewText, { profile }, 'Preview text')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      parsedBodyHtml = insertEmailPreviewText(parsedBodyHtml, parsedPreviewText)
    }

    parsedBodyHtml = this.insertUnsubscribeLinks(parsedBodyHtml, emailProfile)

    const mailContentSubscriptionHonored = {
      personalizations: [
        {
          to: [
            {
              email: toEmail,
              name: name
            }
          ],
          bcc: bcc.length > 0 ? bcc : undefined,
          custom_args: {
            ...this.payload.customArgs,
            source_id: this.settings.sourceId,
            space_id: this.settings.spaceId,
            user_id: this.payload.userId ?? undefined,
            __segment_internal_external_id_key__: EXTERNAL_ID_KEY,
            __segment_internal_external_id_value__: profile[EXTERNAL_ID_KEY]
          }
        }
      ],
      from: {
        email: this.payload.fromEmail,
        name: this.payload.fromName
      },
      reply_to: {
        email: this.payload.replyToEmail,
        name: this.payload.replyToName
      },
      subject: parsedSubject,
      content: [
        {
          type: 'text/html',
          value: parsedBodyHtml
        }
      ],
      tracking_settings: {
        subscription_tracking: {
          enable: true,
          substitution_tag: '[unsubscribe]'
        }
      }
    }
    let mailContent
    if (this.payload.byPassSubscription) {
      mailContent = {
        ...mailContentSubscriptionHonored,
        mail_settings: {
          bypass_list_management: {
            enable: true
          }
        }
      }
      this.statsClient?.incr('actions-personas-messaging-sendgrid.this.request.by_pass_subscription', 1)
    } else {
      mailContent = mailContentSubscriptionHonored
      this.statsClient?.incr('actions-personas-messaging-sendgrid.this.request.dont_pass_subscription', 1)
    }
    const req: RequestOptions = {
      method: 'post',
      headers: {
        authorization: `Bearer ${this.settings.sendGridApiKey}`
      },
      json: mailContent
    }
    this.statsClient?.set('actions-personas-messaging-sendgrid.this.request_body_size', JSON.stringify(req).length)
    const response = await this.request('https://api.sendgrid.com/v3/mail/send', req)
    this.tags.push(`sendgrid_status_code:${response.status}`)
    this.statsClient?.incr('actions-personas-messaging-sendgrid.response', 1)
    if (this.payload?.eventOccurredTS != undefined) {
      this.statsClient?.histogram(
        'eventDeliveryTS',
        Date.now() - new Date(this.payload?.eventOccurredTS).getTime(),
        this.tags
      )
    }
    return response
  }

  async fetchProfileTraits(profileId: string): Promise<Record<string, string>> {
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

  async generateEmailHtml(design: string): Promise<string> {
    try {
      this.statsClient.incr('actions-personas-messaging-sendgrid.unlayer_request', 1)
      const response = await this.request('https://api.unlayer.com/v2/export/html', {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(`${this.settings.unlayerApiKey}:`).toString('base64')}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          displayMode: 'email',
          design: JSON.parse(design)
        })
      })

      const body = await response.json()
      return (body as UnlayerResponse).data.html
    } catch (error) {
      this.logger.error(`export request failure - ${this.settings.spaceId} - [${error}]`)
      this.tags.push('reason:generate_email_html')
      this.statsClient.incr('actions-personas-messaging-sendgrid.error', 1)
      throw new IntegrationError('Unable to export email as HTML', 'Export HTML failure', 400)
    }
  }

  /**
   * Given array of API lookup configs, makes the requests and returns an object that looks like:
   * {
   *   [\<api lookup name\>]: \<data returned from request\>
   * }
   */
  async performApiLookups(this: SendEmailPerformer, apiLookups: ApiLookupConfig[] | undefined, profile: Profile) {
    if (!apiLookups) {
      return {}
    }
    const data = await Promise.all(
      apiLookups.map(async (apiLookup) => {
        const data = await performApiLookup(
          this.requestClient,
          apiLookup,
          profile,
          this.statsClient.statsClient,
          this.tags,
          this.settings,
          this.logger.loggerClient
        )
        return { name: apiLookup.name, data }
      })
    )

    return data.reduce<Record<string, unknown>>((acc, { name, data }) => {
      acc[name] = data
      return acc
    }, {})
  }

  insertUnsubscribeLinks(html: string, emailProfile: EmailProfile): string {
    const spaceId = this.settings.spaceId
    const groupId = this.payload.groupId
    const globalUnsubscribeLink = emailProfile?.unsubscribeLink
    const preferencesLink = emailProfile?.preferencesLink
    const unsubscribeLinkRef = 'a[href*="[upa_unsubscribe_link]"]'
    const preferencesLinkRef = 'a[href*="[upa_preferences_link]"]'
    const sendgridUnsubscribeLinkTag = '[unsubscribe]'
    const $ = cheerio.load(html)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    if (groupId) {
      const group = emailProfile.groups?.find((grp) => grp.id === groupId)
      const groupUnsubscribeLink = group?.groupUnsubscribeLink
      $(unsubscribeLinkRef).each(function () {
        if (!groupUnsubscribeLink) {
          _this.logger.info(`Group Unsubscribe link missing  - ${spaceId}`)
          _this.statsClient.incr('actions-personas-messaging-sendgrid.group_unsubscribe_link_missing', 1)
          $(this).attr('href', sendgridUnsubscribeLinkTag)
        } else {
          $(this).attr('href', groupUnsubscribeLink)
          _this.logger?.info(`Group Unsubscribe link replaced  - ${spaceId}`)
          _this.statsClient?.incr('actions-personas-messaging-sendgrid.replaced_group_unsubscribe_link', 1)
        }
      })
    } else {
      $(unsubscribeLinkRef).each(function () {
        if (!globalUnsubscribeLink) {
          _this.logger?.info(`Global Unsubscribe link missing  - ${spaceId}`)
          _this.statsClient?.incr('actions-personas-messaging-sendgrid.global_unsubscribe_link_missing', 1)
          $(this).attr('href', sendgridUnsubscribeLinkTag)
        } else {
          $(this).attr('href', globalUnsubscribeLink)
          _this.logger?.info(`Global Unsubscribe link replaced  - ${spaceId}`)
          _this.statsClient?.incr('actions-personas-messaging-sendgrid.replaced_global_unsubscribe_link', 1)
        }
      })
    }
    $(preferencesLinkRef).each(function () {
      if (!preferencesLink) {
        // Remove the Manage Preferences link placeholder and the pipe (' | ') symbol
        $(this.parent?.children).each(function () {
          if ($(this).text() == ' | ') {
            $(this).remove()
          }
        })
        $(this).remove()
        _this.logger?.info(`Preferences link removed from the html body  - ${spaceId}`)
        _this.statsClient?.incr('actions-personas-messaging-sendgrid.removed_preferences_link', 1)
      } else {
        $(this).attr('href', preferencesLink)
        _this.logger?.info(`Preferences link replaced  - ${spaceId}`)
        _this.statsClient?.incr('actions-personas-messaging-sendgrid.replaced_preferences_link', 1)
      }
    })

    return $.html()
  }
}

export type EmailProfile = ExtId<Payload>
