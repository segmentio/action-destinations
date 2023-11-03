import { ActionDefinition, omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { getApiServerUrl, getConcatenatedName } from '../utils'

const identifyUser: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description:
    '“Creates or updates a user profile, and adds or updates trait values on the user profile that you can use for segmentation within the Launchpad platform.',
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
      description:
        'A unique ID for a known user. This will be used as the Distinct ID. This field is required if the Anonymous ID field is empty',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      type: 'string',
      description:
        'A unique ID for an anonymous user. This will be used as the Distinct ID if the User ID field is empty. This field is required if the User ID field is empty',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      required: true,
      description: 'Properties that you want to set on the user profile and you would want to segment by later.',
      default: {
        '@path': '$.traits'
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    const apiServerUrl = getApiServerUrl(settings.apiRegion)
    let traits

    if (payload.traits && Object.keys(payload.traits).length > 0) {
      const concatenatedName = getConcatenatedName(
        payload.traits.firstName,
        payload.traits.lastName,
        payload.traits.name
      )
      traits = {
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
    }

    const data = {
      distinct_id: payload.userId ? payload.userId : payload.anonymousId,
      user_id: payload.userId,
      anonymous_id: payload.anonymousId,
      $ip: payload.ip,
      $set: traits ? traits : {},
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

export default identifyUser
