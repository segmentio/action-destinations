import type { ActionDefinition, RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import Mustache from 'mustache'

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

const fetchProfileExternalIds = async (
  request: RequestFn,
  settings: Settings,
  profileId: string
): Promise<Record<string, string>> => {
  const endpoint = getProfileApiEndpoint(settings.profileApiEnvironment)
  const response = await request(
    `${endpoint}/v1/spaces/${settings.spaceId}/collections/users/profiles/user_id:${profileId}/external_ids?limit=25`,
    {
      headers: {
        authorization: `Basic ${Buffer.from(settings.profileApiAccessToken + ':').toString('base64')}`,
        'content-type': 'application/json'
      }
    }
  )

  const body = await response.json()
  const externalIds: Record<string, string> = {}

  for (const externalId of body.data) {
    externalIds[externalId.type] = externalId.id
  }

  return externalIds
}

interface Profile {
  user_id?: string
  anonymous_id?: string
  email?: string
  traits: Record<string, string>
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Email',
  description: 'Sends Email to a user powered by SendGrid',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
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
      type: 'string',
      required: true
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
      type: 'text',
      required: true
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
      type: 'string',
      required: true
    }
  },
  perform: async (request, { settings, payload }) => {
    const [traits, externalIds] = await Promise.all([
      fetchProfileTraits(request, settings, payload.userId),
      fetchProfileExternalIds(request, settings, payload.userId)
    ])

    const profile: Profile = {
      ...externalIds,
      traits
    }

    if (!profile.email) {
      return
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

    return request('https://api.sendgrid.com/v3/mail/send', {
      method: 'post',
      json: {
        personalizations: [
          {
            to: [
              {
                email: profile.email,
                name: name
              }
            ],
            bcc: JSON.parse(payload.bcc || '[]'),
            custom_args: {
              source_id: settings.sourceId,
              space_id: settings.spaceId,
              user_id: payload.userId
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
        subject: Mustache.render(payload.subject, { profile }),
        content: [
          {
            type: 'text/html',
            value: Mustache.render(payload.body, { profile })
          }
        ]
      }
    })
  }
}

export default action
