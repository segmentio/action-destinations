import { InputField } from '@segment/actions-core'

export const eventProperties: Record<string, InputField> = {
  distinct_id: {
    label: 'Distinct ID',
    type: 'string',
    description: 'A distinct ID specified by you.',
    default: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    }
  },
  anonymous_id: {
    label: 'Anonymous ID',
    type: 'string',
    description: 'A distinct ID randomly generated prior to calling identify.',
    default: {
      '@path': '$.anonymousId'
    }
  },
  user_id: {
    label: 'User ID',
    type: 'string',
    description: 'The distinct ID after calling identify.',
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
  insert_id: {
    label: 'Insert ID',
    type: 'string',
    description: 'A random id that is unique to an event.',
    default: {
      '@path': '$.messageId'
    }
  },
  timestamp: {
    label: 'Timestamp',
    type: 'datetime',
    required: false,
    description: 'The timestamp of the event.',
    default: {
      '@path': '$.timestamp'
    }
  },
  app_name: {
    label: 'App Name',
    type: 'string',
    description: 'The name of your application.',
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
  device_id: {
    label: 'Device ID',
    type: 'string',
    description: 'A unique identifier for the device the user is using.',
    default: {
      '@path': '$.context.device.id'
    }
  },
  device_type: {
    label: 'Device Type',
    type: 'string',
    description: "The type of the user's device.",
    default: {
      '@path': '$.context.device.type'
    }
  },
  device_name: {
    label: 'Device Name',
    type: 'string',
    description: "The name of the user's device.",
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
  url: {
    label: 'URL',
    type: 'string',
    description: 'The full URL of the webpage on which the event is triggered.',
    default: {
      '@path': '$.context.page.url'
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
  },
  referrer: {
    label: 'Referrer',
    type: 'string',
    description: 'Referrer url',
    default: {
      '@path': '$.context.page.referrer'
    }
  },
  userAgent: {
    label: 'User Agent',
    type: 'string',
    description: 'User agent',
    default: {
      '@path': '$.context.userAgent'
    }
  },
  timezone: {
    label: 'Timezone',
    type: 'string',
    description: 'The event timezone',
    required: false,
    default: {
      '@path': '$.context.timezone'
    }
  },
  app_platform: {
    label: 'App Platform',
    type: 'string',
    description: 'The App Platform, if applicable',
    required: false,
    default: {
      '@path': '$.context.app.platform'
    }
  },
  name: {
    label: 'Event Original Name',
    type: 'string',
    description: 'The Event Original Name, if applicable',
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.event' },
        then: { '@path': '$.event' },
        else: { '@path': '$.name' }
      }
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
  context: {
    label: 'Event context',
    description: 'An object of key-value pairs that provides useful context about the event.',
    type: 'object',
    unsafe_hidden: true,
    default: {
      '@path': '$.context'
    }
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
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    required: false,
    default: 1000,
    minimum: 1,
    maximum: 2000
  }
}
