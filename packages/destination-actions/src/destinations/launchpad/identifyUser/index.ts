import { ActionDefinition, omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { getApiServerUrl, getConcatenatedName } from '../utils'

const identifyUser: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID for a particular device ID or update user properties.',
  defaultSubscription: 'type = "identify"',
  fields: {
    ip: {
      label: 'IP Address',
      type: 'string',
      description: "The IP address of the user. This is only used for geolocation and won't be stored.",
      default: {
        '@path': '$.context.ip'
      }
    },
    userId: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description: 'The unique user identifier set by you',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      type: 'string',
      allowNull: true,
      description: 'The generated anonymous ID for the user',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      required: true,
      description: 'Properties to set on the user profile',
      default: {
        '@path': '$.traits'
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    const apiServerUrl = getApiServerUrl(settings.apiRegion)

    if (payload.anonymousId && !payload.traits) {
      const identifyEvent = {
        event: '$identify',
        type: 'screen',
        $set: {
          $distinct_id: payload.userId,
          $anonymous_id: payload.anonymousId,
          segment_source_name: settings.sourceName
        },
        distinct_id: payload.anonymousId,
        api_key: settings.apiSecret
      }
      const identifyResponse = await request(`${apiServerUrl}capture`, {
        method: 'post',
        json: identifyEvent
      })

      return identifyResponse
    }

    if (payload.traits && Object.keys(payload.traits).length > 0) {
      const concatenatedName = getConcatenatedName(
        payload.traits.firstName,
        payload.traits.lastName,
        payload.traits.name
      )
      const traits = {
        ...omit(payload.traits, ['created', 'email', 'firstName', 'lastName', 'name', 'username', 'phone']),
        // to fit the Launchpad expectations, transform the special traits to Launchpad reserved property
        $created: payload.traits.created,
        $email: payload.traits.email,
        $first_name: payload.traits.firstName,
        $last_name: payload.traits.lastName,
        $name: concatenatedName,
        $username: payload.traits.username,
        $phone: payload.traits.phone,
        ...payload.traits
      }
      const data = {
        distinct_id: payload.userId,
        $ip: payload.ip,
        $set: traits,
        event: '$identify',
        type: 'screen',
        api_key: settings.apiSecret
      }
      const identifyResponse = request(`${apiServerUrl}capture`, {
        method: 'post',
        json: data
      })
      return identifyResponse
    }
  }
}

export default identifyUser
