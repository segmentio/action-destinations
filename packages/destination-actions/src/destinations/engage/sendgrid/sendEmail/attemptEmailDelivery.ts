import { IntegrationError, RequestClient, RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Logger, StatsClient } from '@segment/actions-core/destination-kit'
import { apiLookupLiquidKey, performApiLookups } from '../utils/api-lookups'
import { Profile } from '../utils/types'
import { insertEmailPreviewText } from './insertEmailPreviewText'
import { insertUnsubscribeLinks } from './insertUnsubscribeLinks'
import { fetchProfileTraits } from './fetchProfileTraits'
import { isRestrictedDomain } from './isRestrictedDomain'
import { generateEmailHtml } from './generateEmailHtml'
import { parseTemplating } from './parseTemplating'

export const EXTERNAL_ID_KEY = 'email'

export const attemptEmailDelivery = async (
  request: RequestClient,
  settings: Settings,
  payload: Payload,
  logger: Logger | undefined,
  statsClient: StatsClient | undefined,
  tags: string[],
  byPassSubscription: boolean
) => {
  let traits
  const emailProfile = payload?.externalIds?.find((meta) => meta.type === 'email')
  if (payload.traitEnrichment) {
    traits = payload?.traits ? payload?.traits : JSON.parse('{}')
  } else {
    if (!payload.userId) {
      logger?.error(
        `TE Messaging: Unable to process email, no userId provided and trait enrichment disabled - ${settings.spaceId}`
      )
      tags.push('reason:missing_user_id')
      statsClient?.incr('actions-personas-messaging-sendgrid.error', 1, tags)
      throw new IntegrationError(
        'Unable to process email, no userId provided and trait enrichment disabled',
        'Invalid parameters',
        400
      )
    }
    traits = await fetchProfileTraits(request, settings, payload.userId, statsClient, tags, logger)
  }

  const profile: Profile = {
    email: emailProfile?.id,
    traits
  }

  const toEmail = payload.toEmail || profile.email

  if (!toEmail) {
    return
  }

  if (isRestrictedDomain(toEmail)) {
    logger?.error(
      `TE Messaging: Emails with gmailx.com, yahoox.com, aolx.com, and hotmailx.com domains are blocked - ${settings.spaceId}`
    )
    tags.push('reason:restricted_domain')
    statsClient?.incr('actions-personas-messaging-sendgrid.error', 1, tags)
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

  const bcc = JSON.parse(payload.bcc ?? '[]')
  const [parsedSubject, apiLookupData] = await Promise.all([
    parseTemplating(payload.subject, { profile }, 'Subject', statsClient, tags, settings, logger),
    performApiLookups(request, payload.apiLookups, profile, statsClient, tags, settings, logger)
  ])

  let parsedBodyHtml

  if (payload.bodyUrl && settings.unlayerApiKey) {
    const { content: body } = await request(payload.bodyUrl, { method: 'GET', skipResponseCloning: true })
    const bodyHtml =
      payload.bodyType === 'html' ? body : await generateEmailHtml(request, settings, body, statsClient, tags, logger)
    parsedBodyHtml = await parseTemplating(
      bodyHtml,
      { profile, [apiLookupLiquidKey]: apiLookupData },
      'Body',
      statsClient,
      tags,
      settings,
      logger
    )
  } else {
    parsedBodyHtml = await parseTemplating(
      payload.bodyHtml ?? '',
      { profile, [apiLookupLiquidKey]: apiLookupData },
      'Body HTML',
      statsClient,
      tags,
      settings,
      logger
    )
  }

  // only include preview text in design editor templates
  if (payload.bodyType === 'design' && payload.previewText) {
    const parsedPreviewText = await parseTemplating(
      payload.previewText,
      { profile },
      'Preview text',
      statsClient,
      tags,
      settings,
      logger
    )
    parsedBodyHtml = insertEmailPreviewText(parsedBodyHtml, parsedPreviewText)
  }

  parsedBodyHtml = insertUnsubscribeLinks(
    parsedBodyHtml,
    emailProfile,
    settings.spaceId,
    statsClient,
    tags,
    payload.groupId,
    logger
  )

  try {
    statsClient?.incr('actions-personas-messaging-sendgrid.request', 1, tags)
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
            ...payload.customArgs,
            source_id: settings.sourceId,
            space_id: settings.spaceId,
            user_id: payload.userId ?? undefined,
            __segment_internal_external_id_key__: EXTERNAL_ID_KEY,
            __segment_internal_external_id_value__: profile[EXTERNAL_ID_KEY]
          }
        }
      ],
      from: {
        email: payload.fromEmail,
        name: payload.fromName
      },
      reply_to: {
        email: payload.replyToEmail,
        name: payload.replyToName
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
    if (byPassSubscription) {
      mailContent = {
        ...mailContentSubscriptionHonored,
        mail_settings: {
          bypass_list_management: {
            enable: true
          }
        }
      }
      statsClient?.incr('actions-personas-messaging-sendgrid.request.by_pass_subscription', 1, tags)
    } else {
      mailContent = mailContentSubscriptionHonored
      statsClient?.incr('actions-personas-messaging-sendgrid.request.dont_pass_subscription', 1, tags)
    }
    const req: RequestOptions = {
      method: 'post',
      headers: {
        authorization: `Bearer ${settings.sendGridApiKey}`
      },
      json: mailContent
    }
    statsClient?.set('actions-personas-messaging-sendgrid.request_body_size', JSON.stringify(req).length, tags)
    const response = await request('https://api.sendgrid.com/v3/mail/send', req)
    tags.push(`sendgrid_status_code:${response.status}`)
    statsClient?.incr('actions-personas-messaging-sendgrid.response', 1, tags)
    if (payload?.eventOccurredTS != undefined) {
      statsClient?.histogram(
        'actions-personas-messaging-sendgrid.eventDeliveryTS',
        Date.now() - new Date(payload?.eventOccurredTS).getTime(),
        tags
      )
    }
    return response
  } catch (error: unknown) {
    logger?.error(`TE Messaging: Email message request failure - ${settings.spaceId} - [${error}]`)
    statsClient?.incr('actions-personas-messaging-sendgrid.request-failure', 1, tags)
    throw new IntegrationError('Unable to send email message', 'SendGrid API request failure', 500)
  }
}
