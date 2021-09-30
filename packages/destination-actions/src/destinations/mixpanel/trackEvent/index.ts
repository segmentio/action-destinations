import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEvent } from './types'
import dayjs from '../../../lib/dayjs'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event',
  description: 'Send an event to Mixpanel.',
  defaultSubscription: 'type = "track"',
  fields: {
    user_id: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description: 'A readable ID specified by you.',
      default: {
        '@path': '$.userId'
      }
    },
    device_id: {
      label: 'Device ID',
      type: 'string',
      description:
        'A device-specific identifier, such as the Identifier for Vendor on iOS. Required unless user ID is present. If a device ID is not sent with the event, it will be set to a hashed version of the user ID.',
      default: {
        '@if': {
          exists: { '@path': '$.context.device.id' },
          then: { '@path': '$.context.device.id' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'A unique identifier for your event.',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    time: {
      label: 'Timestamp',
      type: 'datetime',
      description:
        'The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.',
      default: {
        '@path': '$.timestamp'
      }
    },
    event_properties: {
      label: 'Event Properties',
      type: 'object',
      description: 'An object of key-value pairs that represent additional data to be sent along with the event.',
      default: {
        '@path': '$.properties'
      }
    },
    user_properties: {
      label: 'User Properties',
      type: 'object',
      description: 'An object of key-value pairs that represent additional data tied to the user.',
      default: {
        '@path': '$.traits'
      }
    },
    app_name: {
      label: 'App Name',
      type: 'string',
      description: 'The name of your application',
      default: {
        '@path': '$.context.app.name'
      }
    },
    app_namespace: {
      label: 'App Namespace',
      type: 'string',
      description: 'The namespace of your application.',
      default: {
        '@path': '$.context.app.namespace'
      }
    },
    app_build: {
      label: 'App Build',
      type: 'string',
      description: 'The current build of your application.',
      default: {
        '@path': '$.context.app.build'
      }
    },
    app_version: {
      label: 'App Version',
      type: 'string',
      description: 'The current version of your application.',
      default: {
        '@path': '$.context.app.version'
      }
    },
    os_name: {
      label: 'OS Name',
      type: 'string',
      description: 'The name of the mobile operating system or browser that the user is using.',
      default: {
        '@path': '$.context.os.name'
      }
    },
    os_version: {
      label: 'OS Version',
      type: 'string',
      description: 'The version of the mobile operating system or browser the user is using.',
      default: {
        '@path': '$.context.os.version'
      }
    },
    device_type: {
      label: 'Device Type',
      type: 'string',
      description: "The type of the user's device",
      default: {
        '@path': '$.context.device.type'
      }
    },
    device_name: {
      label: 'Device Name',
      type: 'string',
      description: "The name of the user's device",
      default: {
        '@path': '$.context.device.name'
      }
    },
    device_manufacturer: {
      label: 'Device Manufacturer',
      type: 'string',
      description: 'The device manufacturer that the user is using.',
      default: {
        '@path': '$.context.device.manufacturer'
      }
    },
    device_model: {
      label: 'Device Model',
      type: 'string',
      description: 'The device model that the user is using.',
      default: {
        '@path': '$.context.device.model'
      }
    },
    bluetooth: {
      label: 'Bluetooth Enabled',
      type: 'boolean',
      description: 'Whether bluetooth is enabled',
      default: {
        '@path': '$.context.network.bluetooth'
      }
    },
    carrier: {
      label: 'Carrier',
      type: 'string',
      description: 'The carrier that the user is using.',
      default: {
        '@path': '$.context.network.carrier'
      }
    },
    cellular: {
      label: 'Cellular Enabled',
      type: 'boolean',
      description: 'Whether cellular was enabled',
      default: {
        '@path': '$.context.network.cellular'
      }
    },
    country: {
      label: 'Country',
      type: 'string',
      description: 'The current country of the user.',
      default: {
        '@path': '$.context.location.country'
      }
    },
    region: {
      label: 'Region',
      type: 'string',
      description: 'The current region of the user.',
      default: {
        '@path': '$.context.location.region'
      }
    },
    language: {
      label: 'Language',
      type: 'string',
      description: 'The language set by the user.',
      default: {
        '@path': '$.context.locale'
      }
    },
    library_version: {
      label: 'Library Version',
      type: 'string',
      description: 'Library version',
      default: {
        '@path': '$.context.library.version'
      }
    },
    ip: {
      label: 'IP Address',
      type: 'string',
      description: 'The IP address of the user. Use "$remote" to use the IP address on the upload request.',
      default: {
        '@path': '$.context.ip'
      }
    },
    idfa: {
      label: 'Identifier For Advertiser (IDFA)',
      type: 'string',
      description: 'Identifier for Advertiser. _(iOS)_',
      default: {
        '@if': {
          exists: { '@path': '$.context.device.advertisingId' },
          then: { '@path': '$.context.device.advertisingId' },
          else: { '@path': '$.context.device.idfa' }
        }
      }
    },
    insert_id: {
      label: 'Insert ID',
      type: 'string',
      description: 'Insert id generated by Segment.'
    },
    utm_properties: {
      label: 'UTM Properties',
      type: 'object',
      description: 'UTM Tracking Properties',
      properties: {
        utm_source: {
          label: 'UTM Source',
          type: 'string'
        },
        utm_medium: {
          label: 'UTM Medium',
          type: 'string'
        },
        utm_campaign: {
          label: 'UTM Campaign',
          type: 'string'
        },
        utm_term: {
          label: 'UTM Term',
          type: 'string'
        },
        utm_content: {
          label: 'UTM Content',
          type: 'string'
        }
      },
      default: {
        utm_source: { '@path': '$.context.campaign.source' },
        utm_medium: { '@path': '$.context.campaign.medium' },
        utm_campaign: { '@path': '$.context.campaign.name' },
        utm_term: { '@path': '$.context.campaign.term' },
        utm_content: { '@path': '$.context.campaign.content' }
      }
    },
    url: {
      label: 'URL',
      type: 'string',
      description: 'The full URL of the webpage on which the event is triggered.',
      default: {
        '@path': '$.context.page.url'
      }
    },
    wifi: {
      label: 'Wifi',
      type: 'boolean',
      description: 'Set to true if user’s device has an active, available Wifi connection, false if not.',
      default: {
        '@path': '$.context.network.wifi'
      }
    },
    screen_width: {
      label: 'Screen width',
      type: 'number',
      description: 'Width, in pixels, of the device screen.',
      default: {
        '@path': '$.context.screen.density'
      }
    },
    screen_height: {
      label: 'Screen height',
      type: 'number',
      description: 'Height, in pixels, of the device screen.',
      default: {
        '@path': '$.context.screen.density'
      }
    },
    screen_density: {
      label: 'Screen density',
      type: 'number',
      description: 'Pixel density of the device screen.',
      default: {
        '@path': '$.context.screen.density'
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    const datetime = payload.time
    const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()

    const utm = payload.utm_properties || {}

    const event: MixpanelEvent = {
      event: payload.event,
      properties: {
        time: time,
        $ip: payload.ip,
        distinct_id: payload.user_id,
        $app_build_number: payload.app_build,
        $app_version_string: payload.app_version,
        $app_namespace: payload.app_namespace,
        $app_name: payload.app_name,
        $bluetooth_enabled: payload.bluetooth,
        $cellular_enabled: payload.cellular,
        // $browser: string // 'Mobile Safari'
        // $browser_version: string // '9.0'
        $carrier: payload.carrier,
        $current_url: payload.url,
        $device: payload.device_name,
        $device_id: payload.device_id,
        $device_type: payload.device_type,
        $device_name: payload.device_name,
        $insert_id: payload.insert_id, // TODO: will segment always generate an insert id?
        $ios_ifa: payload.idfa,
        $lib_version: payload.library_version,
        $locale: payload.language,
        $manufacturer: payload.device_manufacturer,
        $model: payload.device_model,
        $os: payload.os_name,
        $os_version: payload.os_version,
        $screen_height: payload.screen_height,
        $screen_width: payload.screen_width,
        $screen_density: payload.screen_density,
        $source: 'segment',
        $wifi_enabled: payload.wifi,
        id: payload.user_id, // this is just to maintain backwards compatibility with the classic segment integration
        mp_country_code: payload.country,
        mp_lib: 'segment',
        // segment_source_name: string // 'readme'
        utm_campaign: utm.utm_campaign,
        utm_content: utm.utm_content,
        utm_medium: utm.utm_medium,
        utm_source: utm.utm_source,
        utm_term: utm.utm_term,
        ...payload.event_properties
      }
    }

    if (!settings.apiSecret) {
      throw new Error('Missing api secret')
    }
    return request('https://api.mixpanel.com/import?strict=1', {
      method: 'post',
      json: [event],
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.apiSecret}:`).toString('base64')}`
      }
    })
  }
}

export default action
