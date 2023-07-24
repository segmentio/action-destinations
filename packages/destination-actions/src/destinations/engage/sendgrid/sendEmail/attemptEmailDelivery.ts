import { IntegrationError, RequestOptions } from '@segment/actions-core'
import { apiLookupLiquidKey, performApiLookups } from '../previewApiLookup'
import { Profile } from '../Profile'
import { insertEmailPreviewText } from './insertEmailPreviewText'
import { insertUnsubscribeLinks } from './insertUnsubscribeLinks'
import { fetchProfileTraits } from './fetchProfileTraits'
import { isRestrictedDomain } from './isRestrictedDomain'
import { generateEmailHtml } from './generateEmailHtml'
import { parseTemplating } from './parseTemplating'
import { EmailProfile, SendEmailPerformer } from './SendEmailPerformer'

export const EXTERNAL_ID_KEY = 'email'

export async function attemptEmailDelivery(this: SendEmailPerformer, emailProfile: EmailProfile) {
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
    traits = await fetchProfileTraits.call(this, this.payload.userId)
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
    parseTemplating.call(this, this.payload.subject, { profile }, 'Subject'),
    performApiLookups.call(this, this.payload.apiLookups, profile)
  ])

  let parsedBodyHtml

  if (this.payload.bodyUrl && this.settings.unlayerApiKey) {
    const { content: body } = await this.request(this.payload.bodyUrl, { method: 'GET', skipResponseCloning: true })
    const bodyHtml = this.payload.bodyType === 'html' ? body : await generateEmailHtml.call(this, body)
    parsedBodyHtml = await parseTemplating.call(
      this,
      bodyHtml,
      { profile, [apiLookupLiquidKey]: apiLookupData },
      'Body'
    )
  } else {
    parsedBodyHtml = await parseTemplating.call(
      this,
      this.payload.bodyHtml ?? '',
      { profile, [apiLookupLiquidKey]: apiLookupData },
      'Body HTML'
    )
  }

  // only include preview text in design editor templates
  if (this.payload.bodyType === 'design' && this.payload.previewText) {
    const parsedPreviewText = await parseTemplating.call(this, this.payload.previewText, { profile }, 'Preview text')
    parsedBodyHtml = insertEmailPreviewText(parsedBodyHtml, parsedPreviewText)
  }

  parsedBodyHtml = insertUnsubscribeLinks.call(this, parsedBodyHtml, emailProfile)

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
