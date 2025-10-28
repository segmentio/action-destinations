import { InputField } from '@segment/actions-core'
import { APP } from '../constants'

export const common_fields: Record<string, InputField> = {
  event_source: {
    label: 'Event Source',
    type: 'string',
    required: true,
    description:
      "The type of events you are uploading through TikTok Events API. For non mobile related events use one of the following Integrations: [TikTok Conversions](https://segment.com/docs/connections/destinations/catalog/tiktok-conversions/), [TikTok Offline Conversions](https://segment.com/docs/connections/destinations/catalog/actions-tiktok-offline-conversions) or [TikTok Pixel](https://segment.com/docs/connections/destinations/catalog/actions-tiktok-pixel).",
    default: APP,
    choices: [
      {
        value: APP,
        label: 'The events took place on a Mobile App.'
      }
    ]
  },
  tiktok_app_id: {
    label: 'TikTok App ID',
    type: 'string',
    required: true,
    description: 'Your TikTok App ID. Please see TikTok’s [Events API documentation](TODO) for information on how to find this value.'
  },
  event: {
    label: 'Event Name',
    type: 'string',
    required: true,
    description:
      'Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.'
  },
  event_id: {
    label: 'Event ID',
    type: 'string',
    description: 'Any hashed ID that can identify a unique user/session.',
    default: {
      '@path': '$.messageId'
    }
  },
  timestamp: {
    label: 'Event Timestamp',
    type: 'string',
    description: 'Timestamp that the event took place, in ISO 8601 format.',
    default: {
      '@path': '$.timestamp'
    }
  },
  phone_number: {
    label: 'Phone Number',
    description:
      'A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.phone' },
        then: { '@path': '$.properties.phone' },
        else: { '@path': '$.context.traits.phone' }
      }
    }
  },
  email: {
    label: 'Email',
    description:
      'A single email address or an array of email addresses. Segment will hash this value before sending to TikTok.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.email' },
        then: { '@path': '$.properties.email' },
        else: { '@path': '$.context.traits.email' }
      }
    }
  },
  advertising_id: {
    label: 'Mobile Advertising ID',
    description:
      'Identifier for Advertisers (IDFA for iOS devices and AAID for Android devices). Used for mobile app events tracking.',
    type: 'string',
    default: {
      '@path': '$.context.device.advertisingId'
    }
  },
  app: {
    label: 'App Information',
    type: 'object',
    description: 'Information about the mobile app where the event took place. This field is an allowlist-only feature. If you would like to access it, please contact your TikTok representative.',
    defaultObjectUI: 'keyvalue',
    properties: {
      app_id: {
        label: 'Mobile App ID',
        description: 'For iOS Apps use the app ID found in the App Store URL. For Android Apps in the Google Play store, use the app ID found in the Google Play store URL. For Android Apps not in the Google Play store, use the package name.',
        type: 'string',

      },
      app_name: {
        label: 'App Name',
        description: 'The name of the mobile app.',
        type: 'string',
        default: {
          '@path': '$.context.app.name'
        }
      },
      app_version: {
        label: 'App Version',
        description: 'The version of the mobile app.',
        type: 'string',
        default: {
          '@path': '$.context.app.version'
        }
      }
    },
    default: {
      app_id: {
        '@path': '$.context.app.namespace'
      },
      app_name: {
        '@path': '$.context.app.name'
      },
      app_version: {
        '@path': '$.context.app.version'
      }
    }
  },
  ad: {
    label: 'Ad Information',
    type: 'object',
    description: 'Information about the ad that led to the app event. This field is an allowlist-only feature. If you would like to access it, please contact your TikTok representative.',
    defaultObjectUI: 'keyvalue',
    properties: {
      callback: {
        label: 'Callback',
        description: 'Callback information to help attribute events.',
        type: 'string'
      },
      campaign_id: {
        label: 'Campaign ID',
        description: 'The TikTok Ad Campaign ID.',
        type: 'string'
      },
      ad_id: {
        label: 'Ad ID',
        description: 'Ad group ID.',
        type: 'string'
      },
      creative_id: {
        label: 'Creative ID',
        description: 'Ad ID.',
        type: 'string'
      },
      is_retargeting: {
        label: 'Is Retargeting',
        description: 'Whether the user is a retargeting user.',
        type: 'boolean'
      },
      attributed: {
        label: 'Attributed',
        description: 'Whether the event is attributed.',
        type: 'boolean'
      },
      attribution_type: {
        label: 'Attribution Type',
        description: 'Attribution type.',
        type: 'string'
      },
      attribution_provider: {
        label: 'Attribution Provider',
        description: 'Attribution provider.',
        type: 'string'
      }
    }
  },
  device_details: {
    label: 'Device Details',
    type: 'object',
    description: 'Mobile device details.',
    properties: {
      device_type: {
        label: 'Device Type',
        description: 'Used to help determine which device the Mobile Advertising ID is and Mobile Device ID is for.',
        type: 'string'
      },
      device_id: {
        label: 'Device ID',
        description: 'The iOS IDFV. Android Device ID is not supported at this time.',
        type: 'string'
      },
      device_version: {
        label: 'Device Version',
        description: 'The operating system version of the device.',
        type: 'string'
      },
    },
    default: {
      device_type: {
        '@path': '$.context.device.type'
      },
      device_id: {
        '@path': '$.context.device.id'
      },
      device_version: {
        '@path': '$.context.device.version'
      }
    }
  },
  external_id: {
    label: 'External ID',
    description:
      'Uniquely identifies the user who triggered the conversion event. Segment will hash this value before sending to TikTok. TikTok Conversions Destination supports both string and string[] types for sending external ID(s).',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    }
  },
  locale: {
    label: 'Locale',
    description:
      'The BCP 47 language identifier. For reference, refer to the [IETF BCP 47 standardized code](https://www.rfc-editor.org/rfc/bcp/bcp47.txt).',
    type: 'string',
    default: {
      '@path': '$.context.locale'
    }
  },
  att_status: {
    label: 'App Tracking Transparency Status',
    description: "The App Tracking Transparency (ATT) status of the user on iOS devices. This field is required when sending events from iOS 14.5+ devices but should be set to 'Not Applicable' if the iOS version is below 14 or the device is running Android.",
    type: 'string',
    required: true,
    choices: [
      { label: 'Authorized', value: 'AUTHORIZED' },
      { label: 'Denied', value: 'DENIED' },
      { label: 'Not Determined', value: 'NOT_DETERMINED' },
      { label: 'Restricted', value: 'RESTRICTED' },
      { label: 'Not Applicable', value: 'NOT_APPLICABLE' }
    ],
    default: 'NOT_DETERMINED'
  },
  ip: {
    label: 'IP Address',
    type: 'string',
    description: 'IP address of the device.',
    default: {
      '@path': '$.context.ip'
    }
  },
  user_agent: {
    label: 'User Agent',
    type: 'string',
    description: 'User agent from the user’s device.',
    default: {
      '@path': '$.context.userAgent'
    }
  },
  contents: {
    label: 'Contents',
    type: 'object',
    multiple: true,
    description: 'Related item details for the event.',
    defaultObjectUI: 'keyvalue',
    properties: {
      price: {
        label: 'Price',
        description: 'Price of the item.',
        type: 'number'
      },
      quantity: {
        label: 'Quantity',
        description: 'Number of items.',
        type: 'number'
      },
      content_category: {
        label: 'Content Category',
        description: 'Category of the product item.',
        type: 'string'
      },
      content_id: {
        label: 'Content ID',
        description: 'ID of the product item.',
        type: 'string'
      },
      content_name: {
        label: 'Content Name',
        description: 'Name of the product item.',
        type: 'string'
      },
      brand: {
        label: 'Brand',
        description: 'Brand name of the product item.',
        type: 'string'
      }
    }
  },
  content_ids: {
    label: 'Content IDs',
    description:
      "Product IDs associated with the event, such as SKUs. Do not populate this field if the 'Contents' field is populated. This field accepts a single string value or an array of string values.",
    type: 'string',
    multiple: true,
    default: {
      '@path': '$.properties.content_ids'
    }
  },
  num_items: {
    label: 'Number of Items',
    type: 'number',
    description: 'Number of items when checkout was initiated. Used with the InitiateCheckout event.',
    default: {
      '@path': '$.properties.num_items'
    }
  },
  content_type: {
    label: 'Content Type',
    description:
      'Type of the product item. When the `content_id` in the `Contents` field is specified as a `sku_id`, set this field to `product`. When the `content_id` in the `Contents` field is specified as an `item_group_id`, set this field to `product_group`.',
    type: 'string',
    choices: [
      { label: 'product', value: 'product' },
      { label: 'product_group', value: 'product_group' }
    ],
    default: 'product'
  },
  currency: {
    label: 'Currency',
    type: 'string',
    description: 'Currency for the value specified as ISO 4217 code.',
    default: {
      '@path': '$.properties.currency'
    }
  },
  value: {
    label: 'Value',
    type: 'number',
    description: 'Value of the order or items sold.',
    default: {
      '@if': {
        exists: { '@path': '$.properties.value' },
        then: { '@path': '$.properties.value' },
        else: { '@path': '$.properties.revenue' }
      }
    }
  },
  description: {
    label: 'Description',
    type: 'string',
    description: 'A string description of the item or page.'
  },
  limited_data_use: {
    label: 'Limited Data Use',
    type: 'boolean',
    description:
      'Use this field to flag an event for limited data processing. TikTok will recognize this parameter as a request for limited data processing, and will limit its processing activities accordingly if the event shared occurred in an eligible location. To learn more about the Limited Data Use feature, refer to [Events API 2.0 - Limited Data Use](https://ads.tiktok.com/marketing_api/docs?id=1771101204435970).',
    default: {
      '@path': '$.properties.limited_data_use'
    }
  },
  test_event_code: {
    label: 'Test Event Code',
    type: 'string',
    description:
      'Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your TikTok Events Manager under the "Test Event" tab. You\'ll want to remove your Test Event Code when sending real traffic through this integration.'
  },
  search_string: {
    label: 'Search String',
    type: 'string',
    description: 'The text string entered by the user for the search. Optionally used with the Search event.',
    default: {
      '@path': '$.properties.search_string'
    },
    depends_on: {
      conditions: [
        {
          fieldKey: 'event',
          operator: 'is',
          value: 'Search'
        }
      ]
    }
  }
}
