import { URLSearchParams } from 'url'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description:
    'Set the user ID for a particular device ID or update user properties without sending an event to Amplitude.',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_id: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description:
        'A UUID (unique user ID) specified by you. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event. Required unless device ID is present.',
      default: {
        '@path': '$.userId'
      }
    },
    device_id: {
      label: 'Device ID',
      type: 'string',
      description:
        'A device specific identifier, such as the Identifier for Vendor (IDFV) on iOS. Required unless user ID is present.',
      default: {
        '@if': {
          exists: { '@path': '$.context.device.id' },
          then: { '@path': '$.context.device.id' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    user_properties: {
      label: 'User Properties',
      type: 'object',
      description:
        'Additional data tied to the user in Amplitude. Each distinct value will show up as a user segment on the Amplitude dashboard. Object depth may not exceed 40 layers. **Note:** You can store property values in an array and date values are transformed into string values.',
      default: {
        '@path': '$.traits'
      }
    },
    groups: {
      label: 'Groups',
      type: 'object',
      description:
        "Groups of users for Amplitude's account-level reporting feature. Note: You can only track up to 5 groups. Any groups past that threshold will not be tracked. **Note:** This feature is only available to Amplitude Enterprise customers who have purchased the Amplitude Accounts add-on."
    },
    app_version: {
      label: 'App Version',
      type: 'string',
      description: 'Version of the app the user is on.',
      default: {
        '@path': '$.context.app.version'
      }
    },
    platform: {
      label: 'Platform',
      type: 'string',
      description: 'What platform is sending the data.',
      default: {
        '@path': '$.context.device.type'
      }
    },
    os_name: {
      label: 'OS Name',
      type: 'string',
      description: 'Mobile operating system or browser the user is on.',
      default: {
        '@path': '$.context.os.name'
      }
    },
    os_version: {
      label: 'OS Version',
      type: 'string',
      description: 'Version of the mobile operating system or browser the user is on.',
      default: {
        '@path': '$.context.os.version'
      }
    },
    device_brand: {
      label: 'Device Brand',
      type: 'string',
      description: 'Device brand the user is on.',
      default: {
        '@path': '$.context.device.brand'
      }
    },
    device_manufacturer: {
      label: 'Device Manufacturer',
      type: 'string',
      description: 'Device manufacturer the user is on.',
      default: {
        '@path': '$.context.device.manufacturer'
      }
    },
    device_model: {
      label: 'Device Model',
      type: 'string',
      description: 'Device model the user is on.',
      default: {
        '@path': '$.context.device.model'
      }
    },
    carrier: {
      label: 'Carrier',
      type: 'string',
      description: 'Carrier the user has.',
      default: {
        '@path': '$.context.network.carrier'
      }
    },
    country: {
      label: 'Country',
      type: 'string',
      description: 'Country the user is in.',
      default: {
        '@path': '$.context.location.country'
      }
    },
    region: {
      label: 'Region',
      type: 'string',
      description: 'Geographical region the user is in.',
      default: {
        '@path': '$.context.location.region'
      }
    },
    city: {
      label: 'City',
      type: 'string',
      description: 'What city the user is in.',
      default: {
        '@path': '$.context.location.city'
      }
    },
    dma: {
      label: 'Designated Market Area',
      type: 'string',
      description: 'The Designated Market Area of the user.'
    },
    language: {
      label: 'Language',
      type: 'string',
      description: 'Language the user has set.',
      default: {
        '@path': '$.context.locale'
      }
    },
    paying: {
      label: 'Is Paying',
      type: 'boolean',
      description: 'Whether the user is paying or not.'
    },
    start_version: {
      label: 'Initial Version',
      type: 'string',
      description: 'Version of the app the user was first on.'
    },
    insert_id: {
      label: 'Insert ID',
      type: 'string',
      description:
        'Amplitude will deduplicate subsequent events sent with this ID we have already seen before within the past 7 days. Amplitude recommends generating a UUID or using some combination of device ID, user ID, event type, event ID, and time.'
    }
  },
  perform: (request, { payload, settings }) => {
    return request('https://api.amplitude.com/identify', {
      method: 'post',
      body: new URLSearchParams({
        api_key: settings.apiKey,
        identification: JSON.stringify(payload)
      })
    })
  }
}

export default action
