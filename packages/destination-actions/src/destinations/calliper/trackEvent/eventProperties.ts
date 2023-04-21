import { InputField } from '@segment/actions-core'

export const eventProperties: Record<string, InputField> = {
  event: {
    label: 'Event Type',
    type: 'string',
    description: 'A type of your event, e.g. a sign up or a name of an action within your product.',
    required: true,
    default: {
      '@path': '$.event'
    }
  },
  time: {
    label: 'Timestamp',
    type: 'datetime',
    description:
      'The timestamp of the event. Could be any date string/number value compatible with JavaScript Date constructor: e.g. milliseconds epoch or an ISO datetime. If time is not sent with the event, it will be set to the request time.',
    default: {
      '@path': '$.timestamp'
    }
  },
  anonymous_id: {
    label: 'Anonymous ID',
    type: 'string',
    description: 'A distinct ID of an unidentified (logged out) user. Device id is used if available',
    default: {
      '@if': {
        exists: { '@path': '$.context.device.id' },
        then: { '@path': '$.context.device.id' },
        else: { '@path': '$.anonymousId' }
      }
    }
  },
  user_id: {
    label: 'User ID',
    type: 'string',
    description: 'A distinct ID of an identified (logged in) user.',
    default: {
      '@path': '$.userId'
    }
  },
  group_id: {
    label: 'Group ID',
    type: 'string',
    description: 'The unique identifier of the group that performed this event.',
    default: {
      '@path': '$.context.groupId'
    }
  },
  event_unique_id: {
    label: 'Event ID',
    type: 'string',
    description:
      'A random id that is unique to an event. ID is being used to prevent event duplication. All the events that share the same unique id besides the first one will be ignored.',
    default: {
      '@path': '$.eventId'
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
  device_id: {
    label: 'Device ID',
    type: 'string',
    description: 'A unique identifier for the device the user is using.',
    default: {
      '@path': '$.context.device.id'
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
    description: 'Whether cellular is enabled.',
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
  city: {
    label: 'City',
    type: 'string',
    description: 'The current city of the user.',
    default: {
      '@path': '$.context.location.city'
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
  library_name: {
    label: 'Library Name',
    type: 'string',
    description: 'The name of the SDK used to send events.',
    default: {
      '@path': '$.context.library.name'
    }
  },
  library_version: {
    label: 'Library Version',
    type: 'string',
    description: 'The version of the SDK used to send events.',
    default: {
      '@path': '$.context.library.version'
    }
  },
  ip: {
    label: 'IP Address',
    type: 'string',
    description: "The IP address of the user. This is only used for geolocation and won't be stored.",
    default: {
      '@path': '$.context.ip'
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
  path: {
    label: 'Page Path',
    type: 'string',
    description: 'The relative URL of the webpage on which the event is triggered.',
    default: {
      '@path': '$.context.page.path'
    }
  },
  page_title: {
    label: 'Page Title',
    type: 'string',
    description: 'The name of the webpage on which the event is triggered.',
    default: {
      '@path': '$.context.page.title'
    }
  },
  referrer: {
    label: 'Referrer',
    type: 'string',
    description: 'Referrer url',
    default: {
      '@path': '$.context.page.referrer'
    }
  },
  user_agent: {
    label: 'User Agent',
    type: 'string',
    description: 'User agent',
    default: {
      '@path': '$.context.userAgent'
    }
  },
  event_properties: {
    label: 'Event Properties',
    type: 'object',
    description: 'An object of key-value pairs that represent additional data to be sent along with the event.',
    default: {
      '@path': '$.properties'
    }
  }
}
