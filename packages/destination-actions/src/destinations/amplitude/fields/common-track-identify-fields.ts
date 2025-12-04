import { InputField } from '@segment/actions-core'

export const app_version: InputField = {
    label: 'App Version',
    type: 'string',
    description: 'The current version of your application.',
    default: {
      '@path': '$.context.app.version'
    }
}

export const carrier: InputField = {
  label: 'Carrier',
  type: 'string',
  description: 'The carrier that the user is using.',
  default: {
    '@path': '$.context.network.carrier'
  }
}

export const city: InputField = {
  label: 'City',
  type: 'string',
  description: 'The current city of the user.',
  default: {
    '@path': '$.context.location.city'
  }
}

export const country: InputField = {
  label: 'Country',
  type: 'string',
  description: 'The current country of the user.',
  default: {
    '@path': '$.context.location.country'
  }
}

export const region: InputField = {
  label: 'Region',
  type: 'string',
  description: 'The current region of the user.',
  default: {
    '@path': '$.context.location.region'
  }
}

export const device_brand: InputField = {
  label: 'Device Brand',
  type: 'string',
  description: 'The device brand that the user is using.',
  default: {
    '@path': '$.context.device.brand'
  }
}

export const device_manufacturer: InputField = {
  label: 'Device Manufacturer',
  type: 'string',
  description: 'The device manufacturer that the user is using.',
  default: {
    '@path': '$.context.device.manufacturer'
  }
};

export const device_model: InputField = {
  label: 'Device Model',
  type: 'string',
  description: 'The device model that the user is using.',
  default: {
    '@path': '$.context.device.model'
  }
}

export const dma: InputField = {
  label: 'Designated Market Area',
  type: 'string',
  description: 'The current Designated Market Area of the user.'
}

export const groups: InputField = {
    label: 'Groups',
    type: 'object',
    description:
      'Groups of users for the event as an event-level group. You can only track up to 5 groups. **Note:** This Amplitude feature is only available to Enterprise customers who have purchased the Accounts add-on.'
}

export const includeRawUserAgent: InputField ={
    label: 'Include Raw User Agent',
    type: 'boolean',
    description:
    'Enabling this setting will send user_agent based on the raw user agent string provided in the userAgent field',
    default: false
}

export const language: InputField = {
  label: 'Language',
  type: 'string',
  description: 'The language set by the user.',
  default: {
    '@path': '$.context.locale'
  }
}

export const library: InputField = {
  label: 'Library',
  type: 'string',
  description: 'The name of the library that generated the event.',
  default: {
    '@path': '$.context.library.name'
  }
}

export const os_name: InputField = {
    label: 'OS Name',
    type: 'string',
    description: 'The name of the mobile operating system or browser that the user is using.',
    default: {
      '@path': '$.context.os.name'
    }
}

export const os_version: InputField = {
  label: 'OS Version',
  type: 'string',
  description: 'The version of the mobile operating system or browser the user is using.',
  default: {
    '@path': '$.context.os.version'
  }
};

export const platform: InputField = {
    label: 'Platform',
    type: 'string',
    description:
      'Platform of the device. If using analytics.js to send events from a Browser and no if no Platform value is provided, the value "Web" will be sent.',
    default: {
      '@path': '$.context.device.type'
    }
}

export const userAgent: InputField ={
    label: 'User Agent',
    type: 'string',
    description: 'The user agent of the device sending the event.',
    default: {
    '@path': '$.context.userAgent'
    }
}

export const userAgentData: InputField = {
  label: 'User Agent Data',
  type: 'object',
  description: 'The user agent data of device sending the event',
  properties: {
    model: {
      label: 'Model',
      type: 'string'
    },
    platformVersion: {
      label: 'PlatformVersion',
      type: 'string'
    }
  },
  default: {
    model: { '@path': '$.context.userAgentData.model' },
    platformVersion: { '@path': '$.context.userAgentData.platformVersion' }
  }
}

export const userAgentParsing: InputField = {
    label: 'User Agent Parsing',
    type: 'boolean',
    description:
    'Enabling this setting will set the Device manufacturer, Device Model and OS Name properties based on the user agent string provided in the userAgent field',
    default: true
}



export const user_properties: InputField = {
    label: 'User Properties',
    type: 'object',
    description:
      'An object of key-value pairs that represent additional data tied to the user. You can store property values in an array, but note that Amplitude only supports one-dimensional arrays. Date values are transformed into string values. Object depth may not exceed 40 layers.',
    default: {
      '@path': '$.traits'
    }
}

export const common_track_identify_fields = {
  app_version,
  carrier,
  city,
  country,
  region,
  device_brand,
  device_manufacturer,
  device_model,
  dma,
  groups,
  includeRawUserAgent,
  language,
  library,
  os_name,
  os_version,
  platform,
  userAgent,
  userAgentData,
  userAgentParsing,
  user_properties
}






