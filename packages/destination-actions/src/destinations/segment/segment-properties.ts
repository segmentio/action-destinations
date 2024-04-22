import { InputField } from '@segment/actions-core/destination-kit/types'

export const user_id: InputField = {
  label: 'User ID',
  description: 'Unique identifier for the user in your database. A userId or an anonymousId is required.',
  type: 'string'
}

export const anonymous_id: InputField = {
  label: 'Anonymous ID',
  description:
    'A pseudo-unique substitute for a User ID, for cases when you don’t have an absolutely unique identifier. A userId or an anonymousId is required.',
  type: 'string'
}

export const timestamp: InputField = {
  label: 'Timestamp',
  description:
    'Timestamp when the message itself took place as a ISO-8601 format date string. Defaults to current time if not provided.',
  type: 'string'
}

export const page_name: InputField = {
  label: 'Page Name',
  description: 'Name of the page that was viewed.',
  type: 'string'
}

export const screen_name: InputField = {
  label: 'Screen Name',
  description: 'Name of the screen that was viewed.',
  type: 'string'
}

export const event_name: InputField = {
  label: 'Event Name',
  description: 'Name of the action that a user has performed.',
  type: 'string',
  required: true
}

export const page_category: InputField = {
  label: 'Page Category',
  description: 'Category of the page that was viewed.',
  type: 'string'
}

export const application: InputField = {
  label: 'Application',
  description: 'Dictionary of information about the current application.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  properties: {
    name: {
      label: 'Name',
      description: 'The app name.',
      type: 'string'
    },
    version: {
      label: 'Version',
      description: 'The app version.',
      type: 'string'
    },
    build: {
      label: 'Build',
      description: 'The app build.',
      type: 'string'
    },
    namespace: {
      label: 'Namespace',
      description: 'The app namespace.',
      type: 'string'
    }
  }
}

export const campaign_parameters: InputField = {
  label: 'Campaign Parameters',
  description:
    'Dictionary of information about the campaign that resulted in the API call. This maps directly to the common UTM campaign parameters.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  properties: {
    name: {
      label: 'Name',
      description: 'The campaign name.',
      type: 'string'
    },
    source: {
      label: 'Source',
      description: 'The campaign source.',
      type: 'string'
    },
    medium: {
      label: 'Medium',
      description: 'The campaign medium.',
      type: 'string'
    },
    term: {
      label: 'Term',
      description: 'The campaign term.',
      type: 'string'
    },
    content: {
      label: 'Content',
      description: 'The campaign content.',
      type: 'string'
    }
  }
}

export const device: InputField = {
  label: 'Device',
  description: 'Dictionary of information about the device the API call originated from.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  properties: {
    id: {
      label: 'ID',
      description: 'The device ID.',
      type: 'string'
    },
    advertising_id: {
      label: 'Advertising ID',
      description: 'The device Advertising ID.',
      type: 'string'
    },
    adTracking_Enabled: {
      label: 'Ad Tracking Enabled',
      description: 'Whether or not ad tracking is enabled.',
      type: 'boolean'
    },
    manufacturer: {
      label: 'Manufacturer',
      description: 'The device manufacturer.',
      type: 'string'
    },
    model: {
      label: 'Model',
      description: 'The device model.',
      type: 'string'
    },
    name: {
      label: 'Name',
      description: 'The device name.',
      type: 'string'
    },
    type: {
      label: 'Type',
      description: 'The device type.',
      type: 'string'
    },
    token: {
      label: 'Token',
      description: 'The device token.',
      type: 'string'
    }
  }
}

export const ip_address: InputField = {
  label: 'IP Address',
  description: 'The current user’s IP address.',
  type: 'string'
}

export const locale: InputField = {
  label: 'Locale',
  description: 'Locale string for the current user, for example en-US.',
  type: 'string'
}

export const location: InputField = {
  label: 'Location',
  description: 'Dictionary of information about the user’s current location.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  properties: {
    city: {
      label: 'City',
      description: "The user's city",
      type: 'string'
    },
    country: {
      label: 'Country',
      description: "The user's country",
      type: 'string'
    },
    latitude: {
      label: 'Latitude',
      description: "The user's latitude",
      type: 'number'
    },
    longitude: {
      label: 'Longitude',
      description: "The user's longitude",
      type: 'number'
    },
    speed: {
      label: 'Speed',
      description: "The user's speed",
      type: 'number'
    }
  }
}

export const network: InputField = {
  label: 'Network',
  description: 'Dictionary of information about the current network connection.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  properties: {
    bluetooth: {
      label: 'Bluetooth',
      description: 'Whether or not bluetooth is enabled.',
      type: 'boolean'
    },
    carrier: {
      label: 'Carrier',
      description: 'The network carrier.',
      type: 'string'
    },
    cellular: {
      label: 'Cellular',
      description: 'Whether or not cellular data is enabled.',
      type: 'boolean'
    },
    wifi: {
      label: 'WiFi',
      description: 'Whether or not WiFi is enabled.',
      type: 'boolean'
    }
  }
}

export const operating_system: InputField = {
  label: 'Operating System',
  description: 'Dictionary of information about the operating system.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  properties: {
    name: {
      label: 'Name',
      description: 'The operating system name.',
      type: 'string'
    },
    version: {
      label: 'Version',
      description: 'The operating system version.',
      type: 'string'
    }
  }
}

export const page: InputField = {
  label: 'Page',
  description: 'Dictionary of information about the current page in the browser.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  properties: {
    path: {
      label: 'Path',
      description: 'The page path.',
      type: 'string'
    },
    referrer: {
      label: 'Referrer',
      description: 'The page referrer.',
      type: 'string'
    },
    search: {
      label: 'Search',
      description: 'The page search query.',
      type: 'string'
    },
    title: {
      label: 'Title',
      description: 'The page title.',
      type: 'string'
    },
    url: {
      label: 'URL',
      description: 'The page URL.',
      type: 'string'
    }
  }
}

export const screen: InputField = {
  label: 'Screen',
  description: 'Dictionary of information about the device’s screen.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  properties: {
    density: {
      label: 'Density',
      description: 'The screen density.',
      type: 'number'
    },
    height: {
      label: 'Height',
      description: 'The screen height.',
      type: 'number'
    },
    width: {
      label: 'Width',
      description: 'The screen width.',
      type: 'number'
    }
  }
}

export const user_agent: InputField = {
  label: 'User Agent',
  description: 'User agent of the device the API call originated from.',
  type: 'string'
}

export const timezone: InputField = {
  label: 'Timezone',
  description: 'The user’s timezone as a tz database string, for example America/New_York.',
  type: 'string'
}

export const group_id: InputField = {
  label: 'Group ID',
  description: 'The group or account ID a user is associated with.',
  type: 'string'
}

export const properties: InputField = {
  label: 'Properties',
  description: 'Free-form dictionary of properties that describe the screen.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  additionalProperties: true
}

export const traits: InputField = {
  label: 'Traits',
  description: 'Free-form dictionary of traits that describe the user or group of users.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  additionalProperties: true
}
