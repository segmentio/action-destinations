import type { InputField } from '@segment/actions-core'

// Event Type Field
export const eventType: InputField = {
  label: 'Event Type',
  description: 'The type of Segment event being processed',
  type: 'string',
  required: true,
  choices: [
    { label: 'Track Event', value: 'track' },
    { label: 'Page View', value: 'page' },
    { label: 'User Identification', value: 'identify' }
  ],
  default: {
    '@if': {
      exists: { '@path': '$.type' },
      then: { '@path': '$.type' },
      else: 'track'
    }
  }
}

// Event Name Field (for track events)
export const eventName: InputField = {
  label: 'Event Name',
  description: 'Name of the analytics event being tracked',
  type: 'string',
  required: false,
  default: { '@path': '$.event' }
}

// Page Information Field
export const pageInfo: InputField = {
  label: 'Page Information',
  description: 'Information about the page being viewed',
  type: 'object',
  required: false,
  additionalProperties: false,
  properties: {
    name: {
      label: 'Page Name',
      description: 'Name of the page',
      type: 'string',
      required: false
    },
    category: {
      label: 'Page Category',
      description: 'Category of the page',
      type: 'string',
      required: false
    }
  },
  default: {
    name: { '@path': '$.name' },
    category: { '@path': '$.category' }
  }
}

// User Identity Field
export const userIdentity: InputField = {
  label: 'User Identity',
  description: 'User identification information',
  type: 'object',
  required: true,
  additionalProperties: false,
  properties: {
    user_id: {
      label: 'User ID',
      description: 'Unique identifier for known users',
      type: 'string',
      required: false
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Unique identifier for anonymous users',
      type: 'string',
      required: false
    },
    email: {
      label: 'Email Address',
      description: 'User email address',
      type: 'string',
      format: 'email',
      required: false
    },
    phone: {
      label: 'Phone Number',
      description: 'User phone number',
      type: 'string',
      required: false
    }
  },
  default: {
    user_id: { '@path': '$.userId' },
    anonymous_id: { '@path': '$.anonymousId' },
    email: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    },
    phone: {
      '@if': {
        exists: { '@path': '$.context.traits.phone' },
        then: { '@path': '$.context.traits.phone' },
        else: { '@path': '$.properties.phone' }
      }
    }
  }
}

// User Traits Field
export const userTraits: InputField = {
  label: 'User Traits',
  description: 'Additional user profile information',
  type: 'object',
  required: false,
  additionalProperties: true,
  properties: {
    first_name: {
      label: 'First Name',
      description: 'User first name',
      type: 'string',
      required: false
    },
    last_name: {
      label: 'Last Name',
      description: 'User last name',
      type: 'string',
      required: false
    },
    age: {
      label: 'Age',
      description: 'User age',
      type: 'integer',
      minimum: 0,
      required: false
    },
    is_subscribed: {
      label: 'Subscription Status',
      description: 'Whether the user is subscribed',
      type: 'boolean',
      required: false
    }
  },
  default: {
    first_name: {
      '@if': {
        exists: { '@path': '$.context.traits.first_name' },
        then: { '@path': '$.context.traits.first_name' },
        else: { '@path': '$.traits.first_name' }
      }
    },
    last_name: {
      '@if': {
        exists: { '@path': '$.context.traits.last_name' },
        then: { '@path': '$.context.traits.last_name' },
        else: { '@path': '$.traits.last_name' }
      }
    },
    age: {
      '@if': {
        exists: { '@path': '$.context.traits.age' },
        then: { '@path': '$.context.traits.age' },
        else: { '@path': '$.traits.age' }
      }
    },
    is_subscribed: {
      '@if': {
        exists: { '@path': '$.context.traits.is_subscribed' },
        then: { '@path': '$.context.traits.is_subscribed' },
        else: { '@path': '$.traits.is_subscribed' }
      }
    }
  }
}

// Event Properties Field
export const eventProperties: InputField = {
  label: 'Event Properties',
  description: 'Additional properties specific to this event',
  type: 'object',
  required: false,
  additionalProperties: true,
  default: { '@path': '$.properties' }
}

// Device Information Field
export const deviceInfo: InputField = {
  label: 'Device Information',
  description: 'Information about the user device',
  type: 'object',
  required: false,
  additionalProperties: false,
  properties: {
    type: {
      label: 'Device Type',
      description: 'Type of device (mobile, desktop, tablet)',
      type: 'string',
      required: false
    },
    os: {
      label: 'Operating System',
      description: 'Operating system name',
      type: 'string',
      required: false
    },
    browser: {
      label: 'Browser',
      description: 'Browser name',
      type: 'string',
      required: false
    },
    screen_resolution: {
      label: 'Screen Resolution',
      description: 'Screen resolution (e.g., 1920x1080)',
      type: 'string',
      required: false
    }
  },
  default: {
    type: { '@path': '$.context.device.type' },
    os: { '@path': '$.context.os.name' },
    browser: { '@path': '$.context.userAgent' },
    screen_resolution: {
      '@if': {
        exists: { '@path': '$.context.screen.width' },
        then: { '@path': '$.context.screen.width' },
        else: undefined
      }
    }
  }
}

// Location Information Field
export const locationInfo: InputField = {
  label: 'Location Information',
  description: 'User location information',
  type: 'object',
  required: false,
  additionalProperties: false,
  properties: {
    city: {
      label: 'City',
      description: 'User city',
      type: 'string',
      required: false
    },
    country: {
      label: 'Country',
      description: 'User country',
      type: 'string',
      required: false
    },
    region: {
      label: 'Region/State',
      description: 'User region or state',
      type: 'string',
      required: false
    },
    ip_address: {
      label: 'IP Address',
      description: 'User IP address',
      type: 'string',
      format: 'ipv4',
      required: false
    }
  },
  default: {
    city: { '@path': '$.context.location.city' },
    country: { '@path': '$.context.location.country' },
    region: { '@path': '$.context.location.region' },
    ip_address: { '@path': '$.context.ip' }
  }
}

// Message ID Field
export const messageId: InputField = {
  label: 'Message ID',
  description: 'Unique identifier for this message',
  type: 'string',
  required: true,
  default: { '@path': '$.messageId' }
}

// Timestamp Field
export const timestamp: InputField = {
  label: 'Timestamp',
  description: 'When the event occurred (ISO 8601 format)',
  type: 'string',
  format: 'date-time',
  required: true,
  default: { '@path': '$.timestamp' }
}

// Session ID Field
export const sessionId: InputField = {
  label: 'Session ID',
  description: 'Unique identifier for the user session',
  type: 'string',
  required: false,
  default: { '@path': '$.context.sessionId' }
}