import { ActionDefinition, IntegrationError, RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Liquid as LiquidJs } from 'liquidjs'
import cheerio from 'cheerio'
import { htmlEscape } from 'escape-goat'

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
  profileId: string
): Promise<Record<string, string>> => {
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

  const body = await response.json()
  return body.traits
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
}

interface Profile {
  user_id?: string
  anonymous_id?: string
  email?: string
  traits: Record<string, string>
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
    userId: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
      required: true,
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
    }
  },
  perform: async (request, { settings, payload }) => {
    if (!payload.send) {
      return
    }

    const emailProfile = payload?.externalIds?.find((meta) => meta.type === 'email')
    if (
      !emailProfile?.subscriptionStatus ||
      ['unsubscribed', 'did not subscribed', 'false'].includes(emailProfile.subscriptionStatus)
    ) {
      return
    } else if (['subscribed', 'true'].includes(emailProfile?.subscriptionStatus)) {
      const traits = await fetchProfileTraits(request, settings, payload.userId)

      const profile: Profile = {
        email: emailProfile.id,
        traits
      }

      const toEmail = payload.toEmail || profile.email

      if (!toEmail) {
        return
      }

      if (isRestrictedDomain(toEmail)) {
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
      let bodyHtml = payload.bodyHtml ?? ''

      if (payload.bodyUrl && settings.unlayerApiKey) {
        const response = await request(payload.bodyUrl)
        const body = await response.text()
        bodyHtml = payload.bodyType === 'html' ? body : await generateEmailHtml(request, settings.unlayerApiKey, body)

        if (payload.previewText) {
          bodyHtml = insertEmailPreviewText(bodyHtml, payload.previewText)
        }
      }

      const [parsedSubject, parsedBody] = await Promise.all([
        Liquid.parseAndRender(payload.subject, { profile }),
        Liquid.parseAndRender(bodyHtml, { profile })
      ])

      return request('https://api.sendgrid.com/v3/mail/send', {
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
                user_id: payload.userId,
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
              value: parsedBody
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
    } else {
      throw new IntegrationError(
        `Failed to process the subscription state: "${emailProfile.subscriptionStatus}"`,
        'Invalid subscriptionStatus value',
        400
      )
    }
  }
}

export default action
