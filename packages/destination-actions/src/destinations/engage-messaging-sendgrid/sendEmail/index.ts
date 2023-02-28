import { ActionDefinition, IntegrationError, RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Liquid as LiquidJs } from 'liquidjs'
import cheerio from 'cheerio'
import { htmlEscape } from 'escape-goat'
import { StatsClient } from '@segment/actions-core/src/destination-kit'
const Liquid = new LiquidJs()

const insertEmailPreviewText = (html: string, previewText: string): string => {
  const $ = cheerio.load(html)

  // See https://www.litmus.com/blog/the-little-known-preview-text-hack-you-may-want-to-use-in-every-email/
  $('body').prepend(`
    <div style='display: none; max-height: 0px; overflow: hidden;'>
      ${htmlEscape(previewText)}
    </div>

    <div style='display: none; max-height: 0px; overflow: hidden;'>
      ${'&nbsp;&zwnj;'.repeat(13)}&nbsp;
    </div>
  `)

  return $.html()
}

// These profile calls will be removed when Profile sync can fetch external_id
const getProfileApiEndpoint = (environment: string): string => {
  return `https://profiles.segment.${environment === 'production' ? 'com' : 'build'}`
}

type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

const fetchProfileTraits = async (
  request: RequestFn,
  settings: Settings,
  profileId: string,
  statsClient?: StatsClient | undefined,
  tags?: string[] | undefined
): Promise<Record<string, string>> => {
  try {
    const endpoint = getProfileApiEndpoint(settings.profileApiEnvironment)
    const response = await request(
      `${endpoint}/v1/spaces/${settings.spaceId}/collections/users/profiles/user_id:${profileId}/traits?limit=200`,
      {
        headers: {
          authorization: `Basic ${Buffer.from(settings.profileApiAccessToken + ':').toString('base64')}`,
          'content-type': 'application/json'
        }
      }
    )
    tags?.push(`profile_status_code:${response.status}`)
    statsClient?.incr('actions-personas-messaging-sendgrid.profile_invoked', 1, tags)

    const body = await response.json()
    return body.traits
  } catch (error) {
    statsClient?.incr('actions-personas-messaging-sendgrid.profile_error', 1, tags)
    throw new IntegrationError('Unable to get profile traits for email message', 'Email trait fetch failure', 500)
  }
}

const isRestrictedDomain = (email: string): boolean => {
  const restricted = ['gmailx.com', 'yahoox.com', 'aolx.com', 'hotmailx.com']
  const matches = /^.+@(.+)$/.exec(email.toLowerCase())

  if (!matches) {
    return false
  }

  const domain = matches[1]
  return restricted.includes(domain)
}

interface UnlayerResponse {
  success: boolean
  data: {
    html: string
    chunks: {
      css: string
      js: string
      fonts: string[]
      body: string
    }
  }
}

const generateEmailHtml = async (request: RequestFn, apiKey: string, design: string): Promise<string> => {
  try {
    const response = await request('https://api.unlayer.com/v2/export/html', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
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
    throw new IntegrationError('Unable to export email as HTML', 'Export HTML failure', 400)
  }
}

interface Profile {
  user_id?: string
  anonymous_id?: string
  email?: string
  traits: Record<string, string>
}

const parseTemplating = async (content: string, profile: Profile, contentType: string) => {
  try {
    const parsedContent = await Liquid.parseAndRender(content, { profile })
    return parsedContent
  } catch (error) {
    throw new IntegrationError(
      `Unable to parse templating in email ${contentType}`,
      `${contentType} templating parse failure`,
      400
    )
  }
}

const EXTERNAL_ID_KEY = 'email'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Email',
  description: 'Sends Email to a user powered by SendGrid',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    send: {
      label: 'Send Message',
      description: 'Whether or not the message should actually get sent.',
      type: 'boolean',
      required: false,
      default: false
    },
    traitEnrichment: {
      label: 'Trait Enrich',
      description: 'Whether or not trait enrich from event (i.e without profile api call)',
      type: 'boolean',
      required: false,
      default: true
    },
    userId: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    toEmail: {
      label: 'Test Email',
      description: 'Email to send to when testing',
      type: 'string'
    },
    fromDomain: {
      label: 'From Domain',
      description: 'Verified domain in Sendgrid',
      type: 'string',
      allowNull: true
    },
    fromEmail: {
      label: 'From Email',
      description: 'From Email',
      type: 'string',
      required: true
    },
    fromName: {
      label: 'From Name',
      description: 'From Name displayed to end user email',
      type: 'string',
      required: true
    },
    replyToEqualsFrom: {
      label: 'Reply To Equals From',
      description: 'Whether "reply to" settings are the same as "from"',
      type: 'boolean'
    },
    replyToEmail: {
      label: 'Reply To Email',
      description: 'The Email used by user to Reply To',
      type: 'string',
      required: true
    },
    replyToName: {
      label: 'Reply To Name',
      description: 'The Name used by user to Reply To',
      type: 'string',
      required: true
    },
    bcc: {
      label: 'BCC',
      description: 'BCC list of emails',
      type: 'string',
      required: true
    },
    previewText: {
      label: 'Preview Text',
      description: 'Preview Text',
      type: 'string'
    },
    subject: {
      label: 'Subject',
      description: 'Subject for the email to be sent',
      type: 'string',
      required: true
    },
    body: {
      label: 'Body',
      description: 'The message body',
      type: 'text'
    },
    bodyUrl: {
      label: 'Body URL',
      description: 'URL to the message body',
      type: 'text'
    },
    bodyType: {
      label: 'Body Type',
      description: 'The type of body which is used generally html | design',
      type: 'string',
      required: true
    },
    bodyHtml: {
      label: 'Body Html',
      description: 'The HTML content of the body',
      type: 'string'
    },
    groupId: {
      label: 'Group ID',
      description: 'Subscription group ID',
      type: 'string'
    },
    externalIds: {
      label: 'External IDs',
      description: 'An array of user profile identity information.',
      type: 'object',
      multiple: true,
      properties: {
        id: {
          label: 'ID',
          description: 'A unique identifier for the collection.',
          type: 'string'
        },
        type: {
          label: 'type',
          description: 'The external ID contact type.',
          type: 'string'
        },
        subscriptionStatus: {
          label: 'ID',
          description: 'The subscription status for the identity.',
          type: 'string'
        },
        groups: {
          label: 'Subscription Groups',
          description: 'Subscription groups and their statuses for this id.',
          type: 'object',
          multiple: true,
          properties: {
            id: {
              label: 'Subscription group id',
              type: 'string'
            },
            isSubscribed: {
              label: 'status',
              description: 'Group subscription status true is subscribed, false is unsubscribed or did-not-subscribe',
              // for some reason this still gets deserialized as a string.
              type: 'boolean'
            }
          }
        }
      },
      default: {
        '@arrayPath': [
          '$.external_ids',
          {
            id: {
              '@path': '$.id'
            },
            type: {
              '@path': '$.type'
            },
            subscriptionStatus: {
              '@path': '$.isSubscribed'
            },
            groups: {
              '@path': '$.groups'
            }
          }
        ]
      }
    },
    customArgs: {
      label: 'Custom Args',
      description: 'Additional custom args that we be passed back opaquely on webhook events',
      type: 'object',
      required: false
    },
    traits: {
      label: 'Traits',
      description: "A user profile's traits",
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    eventOccurredTS: {
      label: 'Event Timestamp',
      description: 'Time of when the actual event happened.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: async (request, { settings, payload, statsContext }) => {
    const statsClient = statsContext?.statsClient
    const tags = statsContext?.tags
    tags?.push(`space_id:${settings.spaceId}`, `projectid:${settings.sourceId}`)
    if (!payload.send) {
      statsClient?.incr('actions-personas-messaging-sendgrid.send-disabled', 1, tags)
      return
    }
    const emailProfile = payload?.externalIds?.find((meta) => meta.type === 'email')
    if (
      !emailProfile?.subscriptionStatus ||
      ['unsubscribed', 'did not subscribed', 'false'].includes(emailProfile.subscriptionStatus)
    ) {
      statsClient?.incr('actions-personas-messaging-sendgrid.notsubscribed', 1, tags)
      return
    } else if (['subscribed', 'true'].includes(emailProfile?.subscriptionStatus)) {
      statsClient?.incr('actions-personas-messaging-sendgrid.subscribed', 1, tags)
      if (payload.groupId && payload.groupId.length !== 0) {
        const group = (payload.externalIds ?? [])
          .flatMap((externalId) => externalId.groups)
          .find((group) => group?.id === payload.groupId)
        if (!group) {
          statsClient?.incr('actions-personas-messaging-sendgrid.group_notfound', 1, tags)
          return
        } else if (!group.isSubscribed) {
          statsClient?.incr('actions-personas-messaging-sendgrid.group_notsubscribed', 1, tags)
          return
        }
        statsClient?.incr('actions-personas-messaging-sendgrid.group_subscribed', 1, tags)
      }

      let traits
      if (payload.traitEnrichment) {
        traits = payload?.traits ? payload?.traits : JSON.parse('{}')
      } else {
        if (!payload.userId) {
          throw new IntegrationError(
            'Unable to process email, no userId provided and trait enrichment disabled',
            'Invalid parameters',
            400
          )
        }
        traits = await fetchProfileTraits(request, settings, payload.userId, statsClient, tags)
      }

      const profile: Profile = {
        email: emailProfile.id,
        traits
      }

      const toEmail = payload.toEmail || profile.email

      if (!toEmail) {
        return
      }

      if (isRestrictedDomain(toEmail)) {
        statsClient?.incr('actions-personas-messaging-sendgrid.restricted-domain', 1, tags)
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
      const parsedSubject = await parseTemplating(payload.subject, profile, 'Subject')
      let parsedBodyHtml

      if (payload.bodyUrl && settings.unlayerApiKey) {
        const response = await request(payload.bodyUrl)
        const body = await response.text()

        const bodyHtml =
          payload.bodyType === 'html' ? body : await generateEmailHtml(request, settings.unlayerApiKey, body)
        parsedBodyHtml = await parseTemplating(bodyHtml, profile, 'Body')
      } else {
        parsedBodyHtml = await parseTemplating(payload.bodyHtml ?? '', profile, 'Body HTML')
      }

      // only include preview text in design editor templates
      if (payload.bodyType === 'design' && payload.previewText) {
        const parsedPreviewText = await parseTemplating(payload.previewText, profile, 'Preview text')
        parsedBodyHtml = insertEmailPreviewText(parsedBodyHtml, parsedPreviewText)
      }

      const response = await request('https://api.sendgrid.com/v3/mail/send', {
        method: 'post',
        headers: {
          authorization: `Bearer ${settings.sendGridApiKey}`
        },
        json: {
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
                // This is to help disambiguate in the case it's email or email_address.
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
      })
      tags?.push(`sendgrid_status_code:${response.status}`)
      statsClient?.incr('actions-personas-messaging-sendgrid.response', 1, tags)
      if (payload?.eventOccurredTS != undefined) {
        statsClient?.histogram(
          'actions-personas-messaging-sendgrid.eventDeliveryTS',
          Date.now() - new Date(payload?.eventOccurredTS).getTime(),
          tags
        )
      }
      return response
    } else {
      statsClient?.incr('actions-personas-messaging-sendgrid.sendgrid-error', 1, tags)
      throw new IntegrationError(
        `Failed to process the subscription state: "${emailProfile.subscriptionStatus}"`,
        'Invalid subscriptionStatus value',
        400
      )
    }
  }
}

export default action
