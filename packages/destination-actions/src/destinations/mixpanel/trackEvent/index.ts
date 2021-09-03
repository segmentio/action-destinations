import { ActionDefinition, removeUndefined } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEvent } from './types'
import dayjs from '../../../lib/dayjs'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event',
  description: 'Send an event to Amplitude.',
  defaultSubscription: 'type = "track"',
  fields: {
    user_id: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description:
        'A readable ID specified by you. Must have a minimum length of 5 characters. Required unless device ID is present. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event.',
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
    session_id: {
      label: 'Session ID',
      type: 'datetime',
      description:
        'The start time of the session, necessary if you want to associate events with a particular system. To use automatic Amplitude session tracking in browsers, enable Analytics 2.0 on your connected source.',
      default: {
        '@path': '$.integrations.Amplitude.session_id'
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
      description:
        'An object of key-value pairs that represent additional data to be sent along with the event. You can store property values in an array, but note that Amplitude only supports one-dimensional arrays. Date values are transformed into string values. Object depth may not exceed 40 layers.',
      default: {
        '@path': '$.properties'
      }
    },
    user_properties: {
      label: 'User Properties',
      type: 'object',
      description:
        'An object of key-value pairs that represent additional data tied to the user. You can store property values in an array, but note that Amplitude only supports one-dimensional arrays. Date values are transformed into string values. Object depth may not exceed 40 layers.',
      default: {
        '@path': '$.traits'
      }
    },
    groups: {
      label: 'Groups',
      type: 'object',
      description:
        'Groups of users for the event as an event-level group. You can only track up to 5 groups. **Note:** This Amplitude feature is only available to Enterprise customers who have purchased the Accounts add-on.'
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
    platform: {
      label: 'Platform',
      type: 'string',
      description: 'Platform of the device.',
      default: {
        '@path': '$.context.device.type'
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
    device_name: {
      label: 'Device Name',
      type: 'string',
      description: "The name of the user's device",
      default: {
        '@path': '$.context.device.name'
      }
    },
    device_brand: {
      label: 'Device Brand',
      type: 'string',
      description: 'The device brand that the user is using.',
      default: {
        '@path': '$.context.device.brand'
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
    city: {
      label: 'City',
      type: 'string',
      description: 'The current city of the user.',
      default: {
        '@path': '$.context.location.city'
      }
    },
    dma: {
      label: 'Designated Market Area',
      type: 'string',
      description: 'The current Designated Market Area of the user.'
    },
    language: {
      label: 'Language',
      type: 'string',
      description: 'The language set by the user.',
      default: {
        '@path': '$.context.locale'
      }
    },
    price: {
      label: 'Price',
      type: 'number',
      description:
        'The price of the item purchased. Required for revenue data if the revenue field is not sent. You can use negative values to indicate refunds.',
      default: {
        '@path': '$.properties.price'
      }
    },
    quantity: {
      label: 'Quantity',
      type: 'integer',
      description: 'The quantity of the item purchased. Defaults to 1 if not specified.',
      default: {
        '@path': '$.properties.quantity'
      }
    },
    revenue: {
      label: 'Revenue',
      type: 'number',
      description:
        'Revenue = price * quantity. If you send all 3 fields of price, quantity, and revenue, then (price * quantity) will be used as the revenue value. You can use negative values to indicate refunds. **Note:** You will need to explicitly set this if you are using the Amplitude in cloud-mode.',
      default: {
        '@path': '$.properties.revenue'
      }
    },
    productId: {
      label: 'Product ID',
      type: 'string',
      description:
        'An identifier for the item purchased. You must send a price and quantity or revenue with this field.',
      default: {
        '@path': '$.properties.productId'
      }
    },
    revenueType: {
      label: 'Revenue Type',
      type: 'string',
      description:
        'The type of revenue for the item purchased. You must send a price and quantity or revenue with this field.',
      default: {
        '@path': '$.properties.revenueType'
      }
    },
    location_lat: {
      label: 'Latitude',
      type: 'number',
      description: 'The current Latitude of the user.',
      default: {
        '@path': '$.context.location.latitude'
      }
    },
    location_lng: {
      label: 'Longtitude',
      type: 'number',
      description: 'The current Longitude of the user.',
      default: {
        '@path': '$.context.location.longitude'
      }
    },
    ip: {
      label: 'IP Address',
      type: 'string',
      description:
        'The IP address of the user. Use "$remote" to use the IP address on the upload request. Amplitude will use the IP address to reverse lookup a user\'s location (city, country, region, and DMA). Amplitude has the ability to drop the location and IP address from events once it reaches our servers. You can submit a request to Amplitude\'s platform specialist team here to configure this for you.',
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
    idfv: {
      label: 'Identifier For Vendor (IDFV)',
      type: 'string',
      description: 'Identifier for Vendor. _(iOS)_',
      default: {
        '@path': '$.context.device.id'
      }
    },
    adid: {
      label: 'Google Play Services Advertising ID',
      type: 'string',
      description: 'Google Play Services advertising ID. _(Android)_',
      default: {
        '@if': {
          exists: { '@path': '$.context.device.advertisingId' },
          then: { '@path': '$.context.device.advertisingId' },
          else: { '@path': '$.context.device.idfa' }
        }
      }
    },
    android_id: {
      label: 'Android ID',
      type: 'string',
      description: 'Android ID (not the advertising ID). _(Android)_'
    },
    event_id: {
      label: 'Event ID',
      type: 'integer',
      description:
        'An incrementing counter to distinguish events with the same user ID and timestamp from each other. Amplitude recommends you send an event ID, increasing over time, especially if you expect events to occur simultanenously.'
    },
    insert_id: {
      label: 'Insert ID',
      type: 'string',
      description:
        'Amplitude will deduplicate subsequent events sent with this ID we have already seen before within the past 7 days. Amplitude recommends generating a UUID or using some combination of device ID, user ID, event type, event ID, and time.'
    },
    products: {
      label: 'Products',
      description: 'The list of products purchased.',
      type: 'object',
      multiple: true,
      properties: {
        price: {
          label: 'Price',
          type: 'number',
          description:
            'The price of the item purchased. Required for revenue data if the revenue field is not sent. You can use negative values to indicate refunds.'
        },
        quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'The quantity of the item purchased. Defaults to 1 if not specified.'
        },
        revenue: {
          label: 'Revenue',
          type: 'number',
          description:
            'Revenue = price * quantity. If you send all 3 fields of price, quantity, and revenue, then (price * quantity) will be used as the revenue value. You can use negative values to indicate refunds.'
        },
        productId: {
          label: 'Product ID',
          type: 'string',
          description:
            'An identifier for the item purchased. You must send a price and quantity or revenue with this field.'
        },
        revenueType: {
          label: 'Revenue Type',
          type: 'string',
          description:
            'The type of revenue for the item purchased. You must send a price and quantity or revenue with this field.'
        }
      },
      default: {
        '@path': '$.properties.products'
      }
    },
    use_batch_endpoint: {
      label: 'Use Batch Endpoint',
      description:
        "If true, events are sent to Amplitude's `batch` endpoint rather than their `httpapi` events endpoint. Enabling this setting may help reduce 429s – or throttling errors – from Amplitude. More information about Amplitude's throttling is available in [their docs](https://developers.amplitude.com/docs/batch-event-upload-api#429s-in-depth).",
      type: 'boolean',
      default: false
    },
    userAgent: {
      label: 'User Agent',
      type: 'string',
      description: 'The user agent of the device sending the event.',
      default: {
        '@path': '$.context.user_agent'
      }
    },
    userAgentParsing: {
      label: 'User Agent Parsing',
      type: 'boolean',
      description:
        'Enabling this setting will set the Device manufacturer, Device Model and OS Name properties based on the user agent string provided in the userAgent field',
      default: true
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
    referrer: {
      label: 'Referrer',
      type: 'string',
      description:
        'The referrer of the web request. Sent to Amplitude as both last touch “referrer” and first touch “initial_referrer”',
      default: {
        '@path': '$.context.page.referrer'
      }
    },
    url: {
      label: 'URL',
      type: 'string',
      description: 'The full URL of the webpage on which the event is triggered.'
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
    let time
    if (datetime && dayjs.utc(datetime).isValid()) {
      time = dayjs.utc(datetime).valueOf()
      console.log(`datetime was valid: ${datetime}`)
    } else {
      time = Date.now()
    }

    const utm = payload.utm_properties || {}

    const event: MixpanelEvent = {
      event: payload.event,
      properties: {
        time: time,
        $ip: payload.ip,
        distinct_id: payload.user_id,
        $app_build_number: payload.app_build,
        $app_version_string: payload.app_version,
        $bluetooth_enabled: payload.bluetooth,
        // $browser: string // 'Mobile Safari'
        // $browser_version: string // '9.0'
        $carrier: payload.carrier,
        $current_url: payload.url,
        $device: payload.device_name,
        $device_id: payload.device_id,
        $insert_id: payload.insert_id, // TODO: will segment always generate an insert id?
        // $ios_ifa: string // '7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB'
        $lib_version: 'cloud-beta',
        $manufacturer: payload.device_manufacturer,
        $model: payload.device_model,
        $os: payload.os_name,
        $os_version: payload.os_version,
        $screen_height: payload.screen_height,
        $screen_width: payload.screen_width,
        $screen_density: payload.screen_density,
        $source: 'segment',
        $wifi: payload.wifi,
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

    // return request('	https://webhook.site/9c445ca6-cc19-4f89-bbc3-c992270abe72', {
    try {
      const response = await request('https://api.mixpanel.com/import?strict=1', {
        method: 'post',
        json: [removeUndefined(event)],
        headers: {
          authorization: `Basic ${Buffer.from(`${settings.apiSecret}:`).toString('base64')}`
        }
      })
      return response
    } catch (err) {
      console.log(err)
      throw err
    }
  }
}

export default action
