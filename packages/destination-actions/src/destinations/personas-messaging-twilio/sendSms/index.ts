import Handlebars from 'handlebars'
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

const form = (obj: Record<string, string>): string => {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(obj)) {
    searchParams.set(key, value)
  }

  return searchParams.toString()
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
      required: true
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

    if (!profile.phone) {
      return
    }

    const token = Buffer.from(`${settings.twilioAccountId}:${settings.twilioAuthToken}`).toString('base64')

    return request(`https://api.twilio.com/2010-04-01/Accounts/${settings.twilioAccountId}/Messages.json`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${token}`,
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: form({
        Body: Handlebars.compile(payload.body)({ profile }),
        From: payload.fromNumber,
        To: profile.phone ?? '+17072478800'
      })
    })
  }
}

export default action
