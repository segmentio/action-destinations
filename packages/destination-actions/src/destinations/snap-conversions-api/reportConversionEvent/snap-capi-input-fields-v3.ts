import { InputField } from '@segment/actions-core/destination-kit/types'

// FIXME: Can we make field properties required?

const app_data: InputField = {
  label: 'App Events Fields',
  description: `These fields support sending app events to Snapchat through the Conversions API.`,
  type: 'object',
  properties: {
    advertiser_tracking_enabled: {
      label: 'Advertiser Tracking Enabled',
      description: `*Required for app events*
              Use this field to specify ATT permission on an iOS 14.5+ device. Set to 0 for disabled or 1 for enabled.`,
      type: 'boolean'
    },
    application_tracking_enabled: {
      label: 'Application Tracking Enabled',
      type: 'boolean',
      description: `*Required for app events*
              A person can choose to enable ad tracking on an app level. Your SDK should allow an app developer to put an opt-out setting into their app. Use this field to specify the person's choice. Use 0 for disabled, 1 for enabled.`
    },
    version: {
      label: 'ExtInfo Version',
      description: `*Required for app events* Example: 'i2'.`,
      type: 'string',
      choices: [
        { label: 'iOS', value: 'i2' },
        { label: 'Android', value: 'a2' }
      ]
    },
    packageName: {
      label: 'Package Name',
      description: `Example: 'com.snapchat.sdk.samples.hello'.`,
      type: 'string'
    },
    shortVersion: {
      label: 'Short Version',
      description: `Example: '1.0'.`,
      type: 'string'
    },
    longVersion: {
      label: 'Long Version',
      description: `Example: '1.0 long'.`,
      type: 'string'
    },
    osVersion: {
      label: '*Required for app events* OS Version',
      description: `Example: '13.4.1'.`,
      type: 'string'
    },
    deviceName: {
      label: 'Device Model Name',
      description: `Example: 'iPhone5,1'.`,
      type: 'string'
    },
    locale: {
      label: 'Locale',
      description: `Example: 'En_US'.`,
      type: 'string'
    },
    timezone: {
      label: 'Timezone Abbreviation',
      description: `Example: 'PST'.`,
      type: 'string'
    },
    carrier: {
      label: 'Carrier Name',
      description: `Example: 'AT&T'.`,
      type: 'string'
    },
    width: {
      label: 'Screen Width',
      description: `Example: '1080'.`,
      type: 'string'
    },
    height: {
      label: 'Screen Height',
      description: `Example: '1920'.`,
      type: 'string'
    },
    density: {
      label: 'Screen Density',
      description: `Example: '2.0'.`,
      type: 'string'
    },
    cpuCores: {
      label: 'CPU Cores',
      description: `Example: '8'.`,
      type: 'string'
    },
    storageSize: {
      label: 'Storage Size in GBs',
      description: `Example: '64'.`,
      type: 'string'
    },
    freeStorage: {
      label: 'Free Storage in GBs',
      description: `Example: '32'.`,
      type: 'string'
    },
    deviceTimezone: {
      label: 'Device Timezone',
      description: `Example: 'USA/New York'.`,
      type: 'string'
    }
  },
  default: {
    application_tracking_enabled: {
      '@path': '$.context.device.adTrackingEnabled'
    },
    packageName: {
      '@path': '$.context.app.namespace'
    },
    longVersion: {
      '@path': '$.context.app.version'
    },
    osVersion: {
      '@path': '$.context.os.version'
    },
    deviceName: {
      '@path': '$.context.device.model'
    },
    locale: {
      '@path': '$.context.locale'
    },
    carrier: {
      '@path': '$.context.network.carrier'
    },
    width: {
      '@path': '$.context.screen.width'
    },
    height: {
      '@path': '$.context.screen.height'
    },
    density: {
      '@path': '$.context.screen.density'
    },
    deviceTimezone: {
      '@path': '$.context.timezone'
    }
  }
}

export const user_data: InputField = {
  label: 'User Data',
  description:
    'These parameters are a set of identifiers Snapchat can use for targeted attribution. You must provide at least one of the following parameters in your request.',
  type: 'object',
  properties: {
    externalId: {
      label: 'External ID',
      description:
        'Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.',
      type: 'string',
      multiple: true // changed the type from string to array of strings.
    },
    email: {
      label: 'Email',
      description: 'An email address in lowercase.',
      type: 'string'
    },
    phone: {
      label: 'Phone',
      description:
        'A phone number. Include only digits with country code, area code, and number. Remove symbols, letters, and any leading zeros. In addition, always include the country code, even if all of the data is from the same country, as the country code is used for matching.',
      type: 'string'
    },
    gender: {
      label: 'Gender',
      description: 'Gender in lowercase. Either f or m.',
      type: 'string'
    },
    dateOfBirth: {
      label: 'Date of Birth',
      description: 'A date of birth given as year, month, and day. Example: 19971226 for December 26, 1997.',
      type: 'string'
    },
    lastName: {
      label: 'Last Name',
      description: 'A last name in lowercase.',
      type: 'string'
    },
    firstName: {
      label: 'First Name',
      description: 'A first name in lowercase.',
      type: 'string'
    },
    city: {
      label: 'City',
      description: 'A city in lowercase without spaces or punctuation. Example: menlopark.',
      type: 'string'
    },
    state: {
      label: 'State',
      description: 'A two-letter state code in lowercase. Example: ca.',
      type: 'string'
    },
    zip: {
      label: 'Zip Code',
      description: 'A five-digit zip code for United States. For other locations, follow each country`s standards.',
      type: 'string'
    },
    country: {
      label: 'Country',
      description: 'A two-letter country code in lowercase.',
      type: 'string'
    },
    client_ip_address: {
      label: 'Client IP Address',
      description: 'The IP address of the browser corresponding to the event.',
      type: 'string'
    },
    client_user_agent: {
      label: 'Client User Agent',
      description:
        'The user agent for the browser corresponding to the event. This is required if action source is “website”.',
      type: 'string'
    },
    subscriptionID: {
      label: 'Subscription ID',
      description: 'The subscription ID for the user in this transaction.',
      type: 'string'
    },
    leadID: {
      label: 'Lead ID',
      description: 'This is the identifier associated with your Snapchat Lead Ad.',
      type: 'integer'
    }
  },
  default: {
    externalId: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    },
    email: {
      '@path': '$.context.traits.email'
    },
    phone: {
      '@path': '$.context.traits.phone'
    },
    dateOfBirth: {
      '@path': '$.context.traits.birthday'
    },
    lastName: {
      '@path': '$.context.traits.lastName'
    },
    firstName: {
      '@path': '$.context.traits.firstName'
    },
    city: {
      '@path': '$.context.traits.address.city'
    },
    state: {
      '@path': '$.context.traits.address.state'
    },
    zip: {
      '@path': '$.context.traits.address.postalCode'
    },
    client_ip_address: {
      '@path': '$.context.ip'
    },
    client_user_agent: {
      '@path': '$.context.userAgent'
    }
  }
}

const snap_capi_input_fields_v3 = { app_data, user_data }

export default snap_capi_input_fields_v3
