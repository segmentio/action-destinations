import { ExtId, MessageSendPerformer, OperationContext, ResponseError, track } from '../../utils'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Profile } from '../../utils/Profile'
import { Liquid as LiquidJs } from 'liquidjs'
import { IntegrationError, RequestOptions } from '@segment/actions-core'
import { ApiLookupConfig, FLAGON_NAME_DATA_FEEDS, apiLookupLiquidKey, performApiLookup } from '../../utils/apiLookups'
import { insertEmailPreviewText } from './insertEmailPreviewText'
import cheerio from 'cheerio'
import { isRestrictedDomain } from './isRestrictedDomain'
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
      this.currentOperation?.tags.push('bypass_subscription:' + true)
      return true
    }

    const isSubscribed = super.isExternalIdSubscribed(extId)
    if (!isSubscribed) return isSubscribed // may be undefined => as invalid

    if (!this.payload.groupId) return isSubscribed

    const recepientGroup = extId.groups?.find((g) => g.id === this.payload.groupId)
    if (!recepientGroup) {
      this.statsClient.incr('group_notfound', 1)
      return false
    }
    if (!recepientGroup.isSubscribed) {
      this.statsClient.incr('group_notsubscribed', 1)
      return false
    }

    return true
  }

  getRecepients(): ExtId<Payload>[] {
    //if toEmail specified => send test email requested
    if (this.payload.toEmail) {
      // Get the externalIdContext from the first elemet of the array, for test emails we only send one externalid (i.e email)
      const externalIdContext = this.payload?.externalIds && this.payload?.externalIds[0]
      return [
        {
          id: this.payload.toEmail,
          type: 'email',
          subscriptionStatus: externalIdContext?.subscriptionStatus,
          unsubscribeLink: externalIdContext?.unsubscribeLink,
          preferencesLink: externalIdContext?.preferencesLink,
          groups: externalIdContext?.groups
        }
      ]
    }
    // only email to the first found subscribed email id
    const res = super.getRecepients()
    if (res.length > 0) return [res[0]]
    return res
  }

  @track({
    wrapIntegrationError: () => [`Unable to parse templating in email`, `templating parse failure`, 400]
  })
  async parseTemplating(
    content: string,
    liquidData: {
      profile: Profile
      [apiLookupLiquidKey]?: Record<string, unknown>
    },
    contentType: string
  ) {
    const parsedContent =
      content == null || content === '<nil>' || content.trim() === ''
        ? content
        : await Liquid.parseAndRender(content, liquidData)
    this.logOnError(() => 'Content type: ' + contentType)
    return parsedContent
  }

  async sendToRecepient(emailProfile: ExtId<Payload>) {
    const traits = await this.getProfileTraits()

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

    const bcc = JSON.parse(this.payload.bcc ?? '[]')
    const [parsedFromEmail, parsedFromName, parsedFromReplyToEmail, parsedFromReplyToName, parsedSubject] =
      await Promise.all([
        this.parseTemplating(this.payload.fromEmail, { profile }, 'FromEmail'),
        this.parseTemplating(this.payload.fromName, { profile }, 'FromName'),
        this.parseTemplating(this.payload.replyToEmail, { profile }, 'ReplyToEmail'),
        this.parseTemplating(this.payload.replyToName, { profile }, 'ReplyToName'),
        this.parseTemplating(this.payload.subject, { profile }, 'Subject')
      ])

    let apiLookupData = {}
    if (this.isFeatureActive(FLAGON_NAME_DATA_FEEDS)) {
      try {
        apiLookupData = await this.performApiLookups(this.payload.apiLookups, profile)
      } catch (error) {
        // Catching error to add tags, rethrowing to continue bubbling up
        this.tags.push('reason:data_feed_failure')
        throw error
      }
    }

    const parsedBodyHtml = await this.getBodyHtml(profile, apiLookupData, emailProfile)

    const mailContentSubscriptionHonored = {
      personalizations: [
        {
          to: [
            {
              email: toEmail
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
        email: parsedFromEmail,
        name: parsedFromName
      },
      reply_to: {
        email: parsedFromReplyToEmail,
        name: parsedFromReplyToName
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
      this.statsClient?.incr('request.by_pass_subscription', 1)
    } else {
      mailContent = mailContentSubscriptionHonored
      this.statsClient?.incr('request.dont_pass_subscription', 1)
    }
    // Check if ip pool name is provided and sends the email with the ip pool name if it is
    if (this.payload.ipPool) {
      mailContent = {
        ...mailContent,
        ip_pool_name: this.payload.ipPool
      }
      this.statsClient?.incr('request.ip_pool_name_provided', 1)
    } else {
      this.statsClient?.incr('request.ip_pool_name_not_provided', 1)
    }
    const req: RequestOptions = {
      method: 'post',
      headers: {
        authorization: `Bearer ${this.settings.sendGridApiKey}`
      },
      json: mailContent
    }
    this.statsClient?.set('message_body_size', JSON.stringify(req).length)
    const response = await this.request('https://api.sendgrid.com/v3/mail/send', req)
    if (this.payload?.eventOccurredTS != undefined) {
      this.statsClient?.histogram(
        'eventDeliveryTS',
        Date.now() - new Date(this.payload?.eventOccurredTS).getTime(),
        this.tags
      )
    }
    return response
  }

  @track()
  async getBodyTemplateFromS3(bodyUrl: string) {
    const { content } = await this.request(bodyUrl, { method: 'GET', skipResponseCloning: true })
    return content
  }

  @track()
  async getBodyHtml(
    profile: Profile,
    apiLookupData: Record<string, unknown>,
    emailProfile: {
      id?: string | undefined
      type?: string | undefined
      subscriptionStatus?: string | undefined
      unsubscribeLink?: string | undefined
      preferencesLink?: string | undefined
      groups?:
        | { id?: string | undefined; isSubscribed?: boolean | undefined; groupUnsubscribeLink?: string | undefined }[]
        | undefined
    }
  ) {
    let parsedBodyHtml
    if (this.payload.bodyUrl && this.settings.unlayerApiKey) {
      const body = await this.getBodyTemplateFromS3(this.payload.bodyUrl)
      const bodyHtml = this.payload.bodyType === 'html' ? body : await this.generateEmailHtml(body)
      parsedBodyHtml = await this.parseTemplating(bodyHtml, { profile, [apiLookupLiquidKey]: apiLookupData }, 'Body')
    } else {
      parsedBodyHtml = await this.parseTemplating(
        this.payload.bodyHtml ?? '',
        { profile, [apiLookupLiquidKey]: apiLookupData },
        'Body HTML'
      )
    }

    if (this.payload.previewText) {
      try {
        const parsedPreviewText = await this.parseTemplating(this.payload.previewText, { profile }, 'Preview text')

        parsedBodyHtml = insertEmailPreviewText(parsedBodyHtml, parsedPreviewText)
      } catch (ex) {
        this.logger?.error('Error inserting preview text, using original html', {
          ex
        })
        this.statsClient.incr('insert_preview_fail', 1)
      }
    }

    parsedBodyHtml = this.insertUnsubscribeLinks(parsedBodyHtml, emailProfile)
    return parsedBodyHtml
  }

  @track({
    wrapIntegrationError: () => ['Unable to export email as HTML', 'Export HTML failure', 400]
  })
  async generateEmailHtml(design: string): Promise<string> {
    this.statsClient.incr('unlayer_request', 1)
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
  }

  /**
   * Given array of API lookup configs, makes the requests and returns an object that looks like:
   * {
   *   [\<api lookup name\>]: \<data returned from request\>
   * }
   */
  @track()
  async performApiLookups(this: SendEmailPerformer, apiLookups: ApiLookupConfig[] | undefined, profile: Profile) {
    if (!apiLookups) {
      return {}
    }
    const request = this.request.bind(this)

    const data = await Promise.all(
      apiLookups.map(async (apiLookup) => {
        const data = await performApiLookup(
          request,
          apiLookup,
          profile,
          this.statsClient.statsClient,
          this.tags,
          this.settings,
          this.logger.loggerClient,
          this.dataFeedCache
        )
        return { name: apiLookup.name, data }
      })
    )

    return data.reduce<Record<string, unknown>>((acc, { name, data }) => {
      acc[name] = data
      return acc
    }, {})
  }

  @track()
  validateLinkAndLog(link: string): void {
    let workspaceId = this.payload.customArgs && this.payload.customArgs['workspace_id']
    let audienceId =
      this.payload.customArgs &&
      (this.payload.customArgs['audience_id'] || this.payload.customArgs['__segment_internal_audience_id__'])
    workspaceId = JSON.stringify(workspaceId)
    audienceId = JSON.stringify(audienceId)

    this.logger.info(`Validating the link: ${link} ${workspaceId} ${audienceId}`)

    const parsedLink = new URL(link)
    // Generic function to check for missing parameters
    const checkParam = (paramName: string) => {
      const paramValue = parsedLink.searchParams.get(paramName)
      if (!paramValue || paramValue === '') {
        this.logger.error(`${paramName} is missing: ${link} ${workspaceId} ${audienceId}`)
        this.statsClient.incr('missing_query_param', 1, [`param:${paramName}`, `audienceId:${audienceId}`])
      }
    }

    // List of required query parameters
    const requiredParams = ['contactId', 'data', 'code', 'spaceId', 'workspaceId', 'messageId', 'user-agent']

    // Check each required parameter
    requiredParams.forEach((param) => checkParam(param))
  }

  @track()
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
          _this.logger.info(`Group Unsubscribe link missing`)
          _this.statsClient.incr('group_unsubscribe_link_missing', 1)
          $(this).attr('href', sendgridUnsubscribeLinkTag)
        } else {
          _this.validateLinkAndLog(groupUnsubscribeLink)
          $(this).removeAttr('href')
          $(this).attr('clicktracking', 'off').attr('href', groupUnsubscribeLink)
          _this.logger?.info(`Group Unsubscribe link replaced`)
          _this.statsClient?.incr('replaced_group_unsubscribe_link', 1)
        }
      })
    } else {
      $(unsubscribeLinkRef).each(function () {
        if (!globalUnsubscribeLink) {
          _this.logger?.info(`Global Unsubscribe link missing`)
          _this.statsClient?.incr('global_unsubscribe_link_missing', 1)
          $(this).attr('href', sendgridUnsubscribeLinkTag)
        } else {
          _this.validateLinkAndLog(globalUnsubscribeLink)
          $(this).removeAttr('href')
          $(this).attr('clicktracking', 'off').attr('href', globalUnsubscribeLink)
          _this.logger?.info(`Global Unsubscribe link replaced`)
          _this.statsClient?.incr('replaced_global_unsubscribe_link', 1)
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
        _this.statsClient?.incr('removed_preferences_link', 1)
      } else {
        _this.validateLinkAndLog(preferencesLink)
        $(this).removeAttr('href')
        $(this).attr('clicktracking', 'off').attr('href', preferencesLink)
        _this.logger?.info(`Preferences link replaced  - ${spaceId}`)
        _this.statsClient?.incr('replaced_preferences_link', 1)
      }
    })

    return $.html()
  }

  onResponse(args: { response?: Response; error?: ResponseError; operation: OperationContext }) {
    const headers = args.response?.headers || args.error?.response?.headers
    // if we need to investigate with sendgrid, we'll need this: https://docs.sendgrid.com/glossary/message-id
    const sgMsgId = headers?.get('X-Message-ID')
    if (sgMsgId) args.operation.logs.push('[sendgrid]X-Message-ID: ' + sgMsgId)
  }
}

export type EmailProfile = ExtId<Payload>
