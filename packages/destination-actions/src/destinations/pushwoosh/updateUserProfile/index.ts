import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { omit } from '@segment/actions-core'

import { getEndpoint, removeEmpty } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update User Profiles',
  description: "Create or Update a user's profile attributes in Pushwoosh.",
  defaultSubscription: 'type = "identify"',
  fields: {
    external_id: {
      label: 'External User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      label: 'Email',
      description: "The user's email",
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.traits.email'
      }
    },
    app_version: {
      label: 'App Version',
      description: 'Version of the app',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.app.version'
      }
    },
    device_id: {
      label: 'Device ID',
      description: 'Device ID',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.device.id'
      }
    },
    device_model: {
      label: 'Device Model',
      description: 'Device Model',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.device.model'
      }
    },
    device_platform: {
      label: 'Device Platform',
      description: 'Device Platform',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.device.type'
      }
    },
    device_token: {
      label: 'Device Token. This is not automatically collected by Segment Mobile Sdks. Add it into the Segment payload if needed',
      description: 'Device Token',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.device.token'
      }
    },
    language: {
      label: 'Language',
      description: 'Language',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.locale'
      }
    },
    country: {
      label: 'Country',
      description: 'The country code of the user',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.location.country'
      }
    },
    city: {
      label: 'City',
      description: 'The city of the user',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.location.city'
      }
    },
    current_location: {
      label: 'Current Location',
      description: "The user's current longitude/latitude.",
      type: 'object',
      allowNull: true,
      properties: {
        latitude: {
          label: 'Latitude',
          type: 'number'
        },
        longitude: {
          label: 'Longitude',
          type: 'number'
        }
      },
      default: {
        latitude: { '@path': '$.context.location.latitude' },
        longitude: { '@path': '$.context.location.longitude' }
      }
    },
    device_os_version: {
      label: 'Device OS Version',
      description: 'The version of the device OS',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.os.version'
      }
    },
    timezone: {
      label: 'Timezone',
      description: 'The timezone of the user',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.timezone'
      }
    },
    user_agent: {
      label: 'User Agent',
      description: 'User agent of the device',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.userAgent'
      }
    },
    custom_attributes: {
      label: 'Custom Attributes',
      description: 'Custom attributes to send to Pushwoosh',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { payload }) => {
    // Since we are merge reserved keys on top of custom_attributes we need to remove them
    // to respect the customers mappings that might resolve `undefined`, without this we'd
    // potentially send a value from `custom_attributes` that conflicts with their mappings.
    const reservedKeys = Object.keys(action.fields)
    const customAttrs = omit(payload.custom_attributes, reservedKeys)

    const endpoint = getEndpoint('/integration-segment/v1/track-user')
    return request(endpoint, {
      method: 'post',
      json: {
        attributes: customAttrs,
        user_id: payload.external_id,
        email: payload.email,
        app_version: payload.app_version,
        device_id: payload.device_id,
        device_model: payload.device_model,
        device_platform: payload.device_platform,
        device_token: payload.device_token,
        language: payload.language,
        country: payload.country,
        city: payload.city,
        current_location: removeEmpty(payload.current_location),
        device_os_version: payload.device_os_version,
        timezone: payload.timezone,
        user_agent: payload.user_agent
      }
    })
  }
}

export default action
