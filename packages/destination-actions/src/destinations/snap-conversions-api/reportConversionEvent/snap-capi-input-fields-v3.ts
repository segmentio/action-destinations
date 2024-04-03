import { InputField, Optional } from '@segment/actions-core/destination-kit/types'

const action_source: InputField = {
  label: 'Action Source',
  description: 'This field allows you to specify where your conversions occurred.',
  type: 'string',
  choices: [
    { label: 'EMAIL', value: 'email' },
    { label: 'WEBSITE', value: 'website' },
    { label: 'APP', value: 'app' },
    { label: 'PHONE CALL', value: 'phone_call' },
    { label: 'CHAT', value: 'chat' },
    { label: 'PHYSICAL STORE', value: 'physical_store' },
    { label: 'SYSTEM GENERATED', value: 'system_generated' },
    { label: 'OTHER', value: 'other' }
  ]
}

const app_data: InputField = {
  label: 'App Data',
  description: `These fields support sending app events to Snapchat through the Conversions API.`,
  type: 'object',
  defaultObjectUI: 'keyvalue',
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

const custom_data_travel_properties: Record<string, Optional<InputField, 'description'>> = {
  checkin_date: {
    label: 'Check-In Date',
    description: `The desired hotel check-in date in the hotel's time-zone. Accepted formats are YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD and YYYY-MM-DDThh:mm:ssTZD`,
    type: 'string'
  },
  travel_end: {
    label: 'Travel End',
    description: `End date of travel`,
    type: 'string'
  },
  travel_start: {
    label: 'Travel Start',
    description: `Start date of travel`,
    type: 'string'
  },
  suggested_destinations: {
    label: 'Suggests Destinations',
    description: `The suggested destinations`,
    type: 'string'
  },
  destination_airport: {
    label: 'Destination Airport',
    description: `The destination airport. Make sure to use the IATA code of the airport`,
    type: 'string'
  },
  country: {
    label: 'Country',
    description: `The country based on the location the user intends to visit`,
    type: 'string'
  },
  city: {
    label: 'City',
    description: `The city based on the location the user intends to visit`,
    type: 'string'
  },
  region: {
    label: 'Region',
    description: `This could be the state, district, or region of interest to the user`,
    type: 'string'
  },
  neighborhood: {
    label: 'Neighborhood',
    description: `The neighborhood the user is interested in`,
    type: 'string'
  },
  departing_departure_date: {
    label: 'Departing Departure Date',
    description: `The starting date and time for travel`,
    type: 'string'
  },
  departing_arrival_date: {
    label: 'Departing Arrival Date',
    description: `The arrival date and time at the destination for the travel`,
    type: 'string'
  },
  num_adults: {
    label: 'Num Adults',
    description: `The number of adults staying`,
    type: 'integer'
  },
  origin_airport: {
    label: 'Origin Airport',
    description: `The official IATA code of origin airport`,
    type: 'string'
  },
  returning_departure_date: {
    label: 'Returning Departure Date',
    description: `The starting date and time of the return journey`,
    type: 'string'
  },
  returning_arrival_date: {
    label: 'Returning Arrival Date',
    description: `The date and time when the return journey is complete`,
    type: 'string'
  },
  num_children: {
    label: 'Num Children',
    description: `The number of children staying`,
    type: 'integer'
  },
  hotel_score: {
    label: 'Hotel Score',
    description: `This represents the hotels score relative to other hotels to an advertiser`,
    type: 'string'
  },
  postal_code: {
    label: 'Postal Code',
    description: `The postal /zip code`,
    type: 'string'
  },
  num_infants: {
    label: 'Num Infants',
    description: `The number of infants staying`,
    type: 'integer'
  },
  preferred_neighborhoods: {
    label: 'Preferred Neighborhoods',
    description: `Any preferred neighborhoods for the stay`,
    type: 'string'
  },
  preferred_star_ratings: {
    label: 'Preferred Star Ratings',
    description: `The minimum and maximum hotel star rating supplied as a tuple. This is what the user would use for filtering hotels`,
    type: 'string'
  },
  suggested_hotels: {
    label: 'Suggested Hotels',
    description: `The suggested hotels`,
    type: 'string'
  }
}

const custom_data: InputField = {
  label: 'Custom Data',
  description: 'The custom data object can be used to pass custom properties.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  properties: {
    currency: {
      label: 'Currency',
      description: 'Currency for the value specified as ISO 4217 code.',
      type: 'string'
    },
    num_items: {
      label: 'Number of Items',
      description: 'The number of items when checkout was initiated.',
      type: 'integer'
    },
    order_id: {
      label: 'Order ID',
      description:
        'Order ID tied to the conversion event. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Ads Kit events.',
      type: 'string'
    },
    search_string: {
      label: 'Search String',
      description: 'The text string that was searched for.',
      type: 'string'
    },
    sign_up_method: {
      label: 'Sign Up Method',
      description: 'A string indicating the sign up method.',
      type: 'string'
    },
    value: {
      label: 'Value',
      description:
        "Total value of the purchase. This should be a single number. Can be overriden using the 'Track Purchase Value Per Product' field.",
      type: 'number'
    },
    ...custom_data_travel_properties
  },
  default: {
    currency: {
      '@path': '$.properties.currency'
    },
    num_items: {
      '@path': '$.properties.quantity'
    },
    order_id: {
      '@path': '$.properties.order_id'
    },
    search_string: {
      '@path': '$.properties.query'
    },
    value: {
      '@if': {
        exists: { '@path': '$.properties.revenue' },
        then: { '@path': '$.properties.revenue' },
        else: { '@path': '$.properties.total' }
      }
    }
  }
}

const user_data: InputField = {
  label: 'User Data',
  description:
    'These parameters are a set of identifiers Snapchat can use for targeted attribution. You must provide at least one of the following parameters in your request.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
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
    },
    madid: {
      label: 'Mobile Ad Identifier',
      description:
        'Mobile ad identifier (IDFA or AAID) of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).',
      type: 'string'
    },
    sc_click_id: {
      label: 'Click ID',
      description:
        "The ID value stored in the landing page URL's `&ScCid=` query parameter. Using this ID improves ad measurement performance. We also encourage advertisers who are using `click_id` to pass the full url in the `page_url` field. For more details, please refer to [Sending a Click ID](#sending-a-click-id)",
      type: 'string'
    },
    sc_cookie1: {
      label: 'uuid_c1 Cookie',
      description:
        'Unique user ID cookie. If you are using the Pixel SDK, you can access a cookie1 by looking at the _scid value.',
      type: 'string'
    },
    idfv: {
      label: 'Identifier for Vendor',
      description: 'IDFV of the user’s device. Segment will normalize and hash this value before sending to Snapchat.',
      type: 'string'
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
      '@if': {
        exists: { '@path': '$.properties.email' },
        then: { '@path': '$.properties.email' },
        else: { '@path': '$.traits.email' }
      }
    },
    phone: {
      '@if': {
        exists: { '@path': '$.properties.phone' },
        then: { '@path': '$.properties.phone' },
        else: { '@path': '$.traits.phone' }
      }
    },
    gender: {
      '@if': {
        exists: { '@path': '$.context.traits.gender' },
        then: { '@path': '$.context.traits.gender' },
        else: { '@path': '$.properties.gender' }
      }
    },
    dateOfBirth: {
      '@if': {
        exists: { '@path': '$.context.traits.birthday' },
        then: { '@path': '$.context.traits.birthday' },
        else: { '@path': '$.properties.birthday' }
      }
    },
    lastName: {
      '@if': {
        exists: { '@path': '$.context.traits.last_name' },
        then: { '@path': '$.context.traits.last_name' },
        else: { '@path': '$.properties.last_name' }
      }
    },
    firstName: {
      '@if': {
        exists: { '@path': '$.context.traits.first_name' },
        then: { '@path': '$.context.traits.first_name' },
        else: { '@path': '$.properties.first_name' }
      }
    },
    city: {
      '@if': {
        exists: { '@path': '$.context.traits.address.city' },
        then: { '@path': '$.context.traits.address.city' },
        else: { '@path': '$.properties.address.city' }
      }
    },
    state: {
      '@if': {
        exists: { '@path': '$.context.traits.address.state' },
        then: { '@path': '$.context.traits.address.state' },
        else: { '@path': '$.properties.address.state' }
      }
    },
    country: {
      '@if': {
        exists: { '@path': '$.context.traits.address.country' },
        then: { '@path': '$.context.traits.address.country' },
        else: { '@path': '$.properties.address.country' }
      }
    },
    zip: {
      '@if': {
        exists: { '@path': '$.context.traits.address.postalCode' },
        then: { '@path': '$.context.traits.address.postalCode' },
        else: { '@path': '$.properties.address.postalCode' }
      }
    },
    client_ip_address: {
      '@path': '$.context.ip'
    },
    client_user_agent: {
      '@path': '$.context.userAgent'
    },
    idfv: {
      '@path': '$.context.device.id'
    },
    madid: {
      '@path': '$.context.device.advertisingId'
    },
    sc_click_id: {
      '@path': '$.integrations.Snap Conversions Api.click_id'
    },
    sc_cookie1: {
      '@path': '$.integrations.Snap Conversions Api.uuid_c1'
    }
  }
}

const data_processing_options: InputField = {
  label: 'Data Processing Options',
  description: `The Data Processing Options to send to Snapchat. If set to true, Segment will send an array to Snapchat indicating events should be processed with Limited Data Use (LDU) restrictions.`,
  type: 'boolean'
}

const data_processing_options_country: InputField = {
  label: 'Data Processing Country',
  description:
    'A country that you want to associate to the Data Processing Options. Accepted values are 1, for the United States of America, or 0, to request that Snapchat geolocates the event using IP address. This is required if Data Processing Options is set to true. If nothing is provided, Segment will send 0.',
  type: 'number',
  choices: [
    { label: `Use Snapchat's Geolocation Logic`, value: 0 },
    { label: 'United States of America', value: 1 }
  ]
}

const data_processing_options_state: InputField = {
  label: 'Data Processing State',
  description:
    'A state that you want to associate to the Data Processing Options. Accepted values are 1000, for California, or 0, to request that Snapchat geolocates the event using IP address. This is required if Data Processing Options is set to true. If nothing is provided, Segment will send 0.',
  type: 'number',
  choices: [
    { label: "Use Snapchat's Geolocation Logic", value: 0 },
    { label: 'California', value: 1000 }
  ]
}

const event_id: InputField = {
  label: 'Event ID',
  description:
    'If you are reporting events via more than one method (Snap Pixel, App Ads Kit, Conversions API) you should use the same event_id across all methods. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Adds Kit events.',
  type: 'string',
  default: {
    '@path': '$.messageId'
  }
}

const event_name: InputField = {
  label: 'Event Name',
  description:
    'The conversion event type. For custom events, you must use one of the predefined event types (i.e. CUSTOM_EVENT_1). Please refer to the possible event types in [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters).',
  type: 'string'
}

const event_source_url: InputField = {
  label: 'Event Source URL',
  description: 'The URL of the web page where the event took place.',
  type: 'string',
  default: {
    '@path': '$.context.page.url'
  }
}

const event_time: InputField = {
  label: 'Event Timestamp',
  description:
    'The Epoch timestamp for when the conversion happened. The timestamp cannot be more than 7 days in the past.',
  type: 'string',
  default: {
    '@path': '$.timestamp'
  }
}

// Ideally this would be a property in custom_data, but object fields cannot contain complex types.
const products: InputField = {
  label: 'Products',
  description:
    "Use this field to send details of mulitple products / items. This field overrides individual 'Item ID', 'Item Category' and 'Brand' fields. Note: total purchase value is tracked using the 'Price' field",
  type: 'object',
  multiple: true,
  additionalProperties: false,
  properties: {
    item_id: {
      label: 'Item ID',
      type: 'string',
      description:
        'Identfier for the item. International Article Number (EAN) when applicable, or other product or category identifier.',
      allowNull: false
    },
    item_category: {
      label: 'Category',
      type: 'string',
      description: 'Category of the item. This field accepts a string.',
      allowNull: false
    },
    brand: {
      label: 'Brand',
      type: 'string',
      description: 'Brand associated with the item. This field accepts a string.',
      allowNull: false
    }
  },
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        item_id: {
          '@path': 'product_id'
        },
        item_category: {
          '@path': 'category'
        },
        brand: {
          '@path': 'brand'
        }
      }
    ]
  }
}

// The order here is important and impacts the UI for event testing.
const snap_capi_input_fields_v3 = {
  event_name,
  event_id,
  event_time,
  action_source,
  user_data,
  app_data,
  custom_data,
  data_processing_options,
  data_processing_options_country,
  data_processing_options_state,
  event_source_url,
  products
}

export default snap_capi_input_fields_v3
