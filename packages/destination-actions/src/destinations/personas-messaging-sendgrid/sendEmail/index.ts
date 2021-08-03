import type { ActionDefinition, RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import Mustache from 'mustache'

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
    `${endpoint}/v1/spaces/${settings.profileApiSpaceId}/collections/users/profiles/user_id:${profileId}/traits?limit=200`,
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
    `${endpoint}/v1/spaces/${settings.profileApiSpaceId}/collections/users/profiles/user_id:${profileId}/external_ids?limit=25`,
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
  phone?: string
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
    from: {
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
    to: {
      label: 'To Email',
      description: 'The Email Address to send an email to',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.email_address' }
    },
    toName: {
      label: 'To Name',
      description: 'The Name of the user to send an email',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.email_address' }
    },
    body: {
      label: 'Body',
      description: 'The message body',
      type: 'text',
      required: true
    },
    subject: {
      label: 'Subject',
      description: 'Subject for the email to be sent',
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
    return request('https://api.sendgrid.com/v3/mail/send', {
      method: 'post',
      json: {
        personalizations: [
          {
            to: [
              {
                email: payload.to,
                name: payload.toName
              }
            ],
            custom_args: {
              source_id: settings.sourceId,
              space_id: settings.profileApiSpaceId,
              user_id: payload.userId
            }
          }
        ],

        from: {
          email: payload.from,
          name: payload.fromName
        },
        subject: Mustache.render(payload.subject, profile),
        content: [
          {
            type: 'text/html',
            value: Mustache.render(payload.body, profile)
          }
        ]
      }
    })
  }
}

export default action
