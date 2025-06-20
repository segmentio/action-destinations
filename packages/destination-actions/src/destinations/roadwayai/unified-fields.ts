import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  enable_batching: {
    type: 'boolean',
    label: 'Batch Data to RoadwayAI',
    description: 'When enabled, the action will use the RoadwayAI batch API.',
    unsafe_hidden: true,
    default: true
  },
  user_id: {
    label: 'User ID',
    type: 'string',
    description: 'The distinct ID after calling identify.',
    default: {
      '@path': '$.userId'
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

  event_properties: {
    label: 'Event Properties',
    type: 'object',
    description: 'An object of key-value pairs that represent additional data to be sent along with the event.',
    default: {
      '@path': '$.properties'
    }
  },

  context: {
    label: 'Event Context',
    description: 'An object of key-value pairs that provides useful context about the event.',
    type: 'object',
    unsafe_hidden: true,
    default: {
      '@path': '$.context'
    }
  }
}

export const appProperties: InputField = {
  label: 'App Properties',
  type: 'object',
  description: 'Application-specific properties and metadata',
  properties: {
    app_name: {
      label: 'App Name',
      type: 'string',
      description: 'The name of your application.'
    },
    app_version: {
      label: 'App Version',
      type: 'string',
      description: 'The current version of your application.'
    }
  },
  default: {
    app_name: { '@path': '$.context.app.name' },
    app_version: { '@path': '$.context.app.version' }
  }
}

export const locationProperties: InputField = {
  label: 'Location Properties',
  type: 'object',
  description: 'User location and locale information',
  properties: {
    country: {
      label: 'Country',
      type: 'string',
      description: 'The current country of the user.'
    },
    region: {
      label: 'Region',
      type: 'string',
      description: 'The current region of the user.'
    },
    language: {
      label: 'Language',
      type: 'string',
      description: 'The language set by the user.'
    }
  },
  default: {
    country: { '@path': '$.context.location.country' },
    region: { '@path': '$.context.location.region' },
    language: { '@path': '$.context.locale' }
  }
}

export const pageProperties: InputField = {
  label: 'Page Properties',
  type: 'object',
  description: 'Web page context and navigation information',
  properties: {
    url: {
      label: 'URL',
      type: 'string',
      description: 'The full URL of the webpage on which the event is triggered.'
    },
    referrer: {
      label: 'Referrer',
      type: 'string',
      description: 'Referrer URL'
    }
  },
  default: {
    url: { '@path': '$.context.page.url' },
    referrer: { '@path': '$.context.page.referrer' }
  }
}

export const utmProperties: InputField = {
  label: 'UTM Properties',
  type: 'object',
  description: 'UTM tracking and campaign attribution properties',
  properties: {
    utm_source: {
      label: 'UTM Source',
      type: 'string',
      description: 'The source of the campaign.'
    },
    utm_medium: {
      label: 'UTM Medium',
      type: 'string',
      description: 'The medium of the campaign.'
    },
    utm_campaign: {
      label: 'UTM Campaign',
      type: 'string',
      description: 'The name of the campaign.'
    },
    utm_term: {
      label: 'UTM Term',
      type: 'string',
      description: 'The term of the campaign.'
    },
    utm_content: {
      label: 'UTM Content',
      type: 'string',
      description: 'The content of the campaign.'
    }
  },
  default: {
    utm_source: { '@path': '$.context.campaign.source' },
    utm_medium: { '@path': '$.context.campaign.medium' },
    utm_campaign: { '@path': '$.context.campaign.name' },
    utm_term: { '@path': '$.context.campaign.term' },
    utm_content: { '@path': '$.context.campaign.content' }
  }
}

export const trackEventFields: Record<string, InputField> = {
  event: {
    label: 'Event Name',
    type: 'string',
    description: 'The name of the action being performed.',
    required: true,
    default: {
      '@path': '$.event'
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

  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    required: false,
    unsafe_hidden: true,
    default: 1000
  }
}

export const identifyUserFields: Record<string, InputField> = {
  timestamp: {
    label: 'Timestamp',
    description: 'A timestamp of when the event took place. Default is current date and time.',
    type: 'string',
    default: {
      '@path': '$.timestamp'
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

  user_id: {
    label: 'User ID',
    type: 'string',
    allowNull: true,
    description: 'The unique user identifier set by you',
    default: {
      '@path': '$.userId'
    }
  },

  anonymous_id: {
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
    description: 'Properties to set on the user profile',
    default: {
      '@path': '$.traits'
    }
  }
}

export const groupUserFields: Record<string, InputField> = {
  user_id: {
    type: 'string',
    unsafe_hidden: true,
    description: 'The identifier of the user',
    label: 'User ID',
    default: {
      '@path': '$.userId'
    }
  },

  anonymous_id: {
    type: 'string',
    unsafe_hidden: true,
    description: 'Anonymous ID of the user',
    label: 'Anonymous ID',
    default: {
      '@path': '$.anonymousId'
    }
  },

  group_id: {
    type: 'string',
    unsafe_hidden: true,
    description: 'ID of the group',
    label: 'Group ID',
    default: {
      '@path': '$.groupId'
    }
  },

  group_name: {
    type: 'string',
    description: 'Name of the group where user belongs to',
    label: 'Group Name',
    default: {
      '@path': '$.traits.name'
    }
  },

  timestamp: {
    type: 'string',
    unsafe_hidden: true,
    required: true,
    description: 'The time the event occurred in UTC',
    label: 'Event Timestamp',
    default: {
      '@path': '$.timestamp'
    }
  },

  traits: {
    type: 'object',
    description: 'Group traits',
    label: 'Group Traits',
    default: {
      '@path': '$.traits'
    }
  },

  context: {
    type: 'object',
    description: 'Event context',
    label: 'Event Context',
    default: {
      '@path': '$.context'
    }
  }
}

export const trackPageViewFields: Record<string, InputField> = {
  id: {
    label: 'Person ID',
    description: 'The ID used to uniquely identify a person in RoadwayAI.',
    type: 'string',
    default: {
      '@path': '$.userId'
    }
  },

  anonymous_id: {
    label: 'Anonymous ID',
    description: 'An anonymous ID for when no Person ID exists.',
    type: 'string',
    default: {
      '@path': '$.anonymousId'
    }
  },

  event_id: {
    label: 'Event ID',
    description: 'An optional identifier used to deduplicate events.',
    type: 'string',
    default: {
      '@path': '$.messageId'
    }
  },

  url: {
    label: 'Page URL',
    description: 'The URL of the page visited.',
    type: 'string',
    required: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.url' },
        then: { '@path': '$.properties.url' },
        else: { '@path': '$.context.page.url' }
      }
    }
  },

  referrer: {
    type: 'string',
    allowNull: true,
    description: 'The page referrer',
    label: 'Page Referrer',
    default: {
      '@if': {
        exists: { '@path': '$.context.page.referrer' },
        then: { '@path': '$.context.page.referrer' },
        else: { '@path': '$.properties.referrer' }
      }
    }
  },

  timestamp: {
    label: 'Timestamp',
    description: 'A timestamp of when the event took place. Default is current date and time.',
    type: 'string',
    default: {
      '@path': '$.timestamp'
    }
  },

  data: {
    label: 'Event Attributes',
    description: 'Optional data to include with the event.',
    type: 'object',
    default: {
      '@path': '$.properties'
    }
  }
}

export const getTrackEventFields = () => ({
  ...commonFields,
  ...trackEventFields,
  app_properties: appProperties,
  location_properties: locationProperties,
  page_properties: pageProperties,
  utm_properties: utmProperties
})

export const getIdentifyUserFields = () => ({
  enable_batching: commonFields.enable_batching,
  ...identifyUserFields
})

export const getGroupUserFields = () => ({
  enable_batching: commonFields.enable_batching,
  ...groupUserFields
})

export const getTrackPageViewFields = () => ({
  enable_batching: commonFields.enable_batching,
  utm_properties: utmProperties,
  ...trackPageViewFields
})
