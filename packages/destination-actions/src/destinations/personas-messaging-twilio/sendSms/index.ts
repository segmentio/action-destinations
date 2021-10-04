import Mustache from 'mustache'
import type { ActionDefinition, RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

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
  phone?: string
  traits: Record<string, string>
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS',
  description: 'Send SMS using Twilio',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    toNumber: {
      label: 'Test Number',
      description: 'Number to send SMS to when testing',
      type: 'string'
    },
    fromNumber: {
      label: 'From Number',
      description: 'Which number to send SMS from',
      type: 'string',
      required: true
    },
    body: {
      label: 'Message',
      description: 'Message to send',
      type: 'text',
      required: true
    },
    customArgs: {
      label: 'Custom Arguments',
      description: 'Additional custom arguments that will be opaquely sent back on webhook events',
      type: 'object',
      required: false
    },
    send: {
      label: 'Send Message',
      description: 'Whether or not the message should actually get sent.',
      type: 'boolean',
      required: false,
      default: false
    }
  },
  perform: async (request, { settings, payload }) => {
    if (!payload.send) {
      return
    }
    const [traits, externalIds] = await Promise.all([
      fetchProfileTraits(request, settings, payload.userId),
      fetchProfileExternalIds(request, settings, payload.userId)
    ])

    const profile: Profile = {
      ...externalIds,
      traits
    }

    const phone = payload.toNumber || profile.phone

    if (!phone) {
      return
    }

    // TODO: GROW-259 remove this when we can extend the request
    // and we no longer need to call the profiles API first
    const token = Buffer.from(`${settings.twilioAccountId}:${settings.twilioAuthToken}`).toString('base64')

    const body = new URLSearchParams({
      Body: Mustache.render(payload.body, { profile }),
      From: payload.fromNumber,
      To: phone
    })

    const webhookUrl = settings.webhookUrl
    const customArgs = payload.customArgs
    if (webhookUrl && customArgs) {
      // Webhook URL parsing has a potential of failing. I think it's better that
      // we fail out of any invocation than silently not getting analytics
      // data if that's what we're expecting.
      const webhookUrlWithParams = new URL(webhookUrl)
      for (const key of Object.keys(customArgs)) {
        webhookUrlWithParams.searchParams.append(key, String(customArgs[key]))
      }
      body.append('StatusCallback', webhookUrlWithParams.toString())
    }

    return request(`https://api.twilio.com/2010-04-01/Accounts/${settings.twilioAccountId}/Messages.json`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${token}`
      },
      body
    })
  }
}

export default action
