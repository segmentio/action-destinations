import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  eventDetails: {
    label: 'Event Details',
    description: 'Details about the event to be sent to Rokt CAPI.',
    type: 'object',
    required: true,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue:only',
    properties: {
      conversiontype: {
        label: 'Conversion Type',
        description:
          'Type of conversion, This should usually be mapped to the Segment track() event name. e.g., "Order Completed".',
        type: 'string'
      },
      confirmationref: {
        label: 'Confirmation Reference',
        description: 'Unique ID for the conversion, ideally an order ID.',
        type: 'string'
      },
      amount: {
        label: 'Amount',
        description: 'Monetary amount associated with the conversion.',
        type: 'number'
      },
      currency: {
        label: 'Currency',
        description: '3-letter ISO currency code (e.g. USD, EUR).',
        type: 'string'
      },
      source_message_id: {
        label: 'Source Message ID',
        description: 'Unique identifier for the source message.',
        type: 'string',
        required: true
      },
      timestamp_unixtime_ms: {
        label: 'Event Timestamp',
        description: 'Event timestamp in Unix time milliseconds.',
        type: 'string',
        required: true
      }
    },
    default: {
      conversiontype: { '@path': '$.event' },
      confirmationref: { '@path': '$.properties.order_id' },
      amount: { '@path': '$.properties.revenue' },
      currency: { '@path': '$.properties.currency' },
      source_message_id: { '@path': '$.messageId' },
      timestamp_unixtime_ms: { '@path': '$.timestamp' }
    }
  },
  eventProperties: {
    label: 'Additional Custom Attributes',
    description: 'Additional custom attributes for the event.',
    type: 'object',
    additionalProperties: true,
    defaultObjectUI: 'keyvalue'
  },
  hashingConfiguration: {
    label: 'Hashing Configuration',
    description: 'Specify if email and certain user attributes should be hashed before sending.',
    type: 'object',
    additionalProperties: false,
    defaultObjectUI: 'keyvalue:only',
    properties: {
      hashEmail: {
        label: 'Hash Email',
        description: 'If enabled, Segment will ensure that the email address is hashed using SHA256 before sending.',
        type: 'boolean',
        default: false
      },
      hashFirstName: {
        label: 'Hash First Name',
        description: 'If enabled, Segment will ensure that the first name is hashed using SHA256 before sending.',
        type: 'boolean',
        default: false
      },
      hashLastName: {
        label: 'Hash Last Name',
        description: 'If enabled, Segment will ensure that the last name is hashed using SHA256 before sending.',
        type: 'boolean',
        default: false
      },
      hashMobile: {
        label: 'Hash Mobile Number',
        description: 'If enabled, Segment will ensure that the mobile number is hashed using SHA256 before sending.',
        type: 'boolean',
        default: false
      },
      hashBillingZipcode: {
        label: 'Hash Billing Zip Code',
        description: 'If enabled, Segment will ensure that the billing zip code is hashed using SHA256 before sending.',
        type: 'boolean',
        default: false
      }
    }
  },
  device_info: {
    label: 'Device Information',
    description: 'Information about the user device.',
    type: 'object',
    properties: {
      http_header_user_agent: {
        label: 'User Agent',
        description: 'Device user agent.',
        type: 'string'
      },
      ios_advertising_id: {
        label: 'iOS Advertising ID',
        description: 'Advertising ID from an iOS mobile device.',
        type: 'string'
      },
      android_advertising_id: {
        label: 'Android Advertising ID',
        description: 'Advertising ID from an Android mobile device.',
        type: 'string'
      },
      ios_idfv: {
        label: 'iOS ID for Vendor',
        description: 'ID for Vendor from an iOS mobile device.',
        type: 'string'
      },
      android_uuid: {
        label: 'Android UUID',
        description: 'UUID from an Android mobile device.',
        type: 'string'
      }
    },
    default: {
      http_header_user_agent: { '@path': '$.context.userAgent' },
      ios_advertising_id: {
        '@liquid':
          "{% if context.device.advertisingId and context.device.type == 'ios' %}{{ context.device.advertisingId }}{% endif %}"
      },
      android_advertising_id: {
        '@liquid':
          "{% if context.device.advertisingId and context.device.type == 'android' %}{{ context.device.advertisingId }}{% endif %}"
      },
      ios_idfv: {
        '@liquid': "{% if context.device.id and context.device.type == 'ios' %}{{ context.device.id }}{% endif %}"
      },
      android_uuid: {
        '@liquid': "{% if context.device.id and context.device.type == 'android' %}{{ context.device.id }}{% endif %}"
      }
    }
  },
  user_identities: {
    label: 'User Identities',
    description:
      'Unique user identifiers used to identify the user. At least one identifier is required, or the advertising ID in device info.',
    type: 'object',
    required: false,
    properties: {
      email: {
        label: 'Email',
        description:
          'User email address. This can be in plain text or hashed using SHA256. If you send plain text and would like Segment to hash the email address for you, enable the "Hash Email" field.',
        type: 'string'
      },
      customerid: {
        label: 'Customer ID',
        description: 'Unique customer identifier.',
        type: 'string'
      }
    },
    default: {
      email: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
      customerid: { '@path': '$.userId' }
    }
  },
  user_attributes: {
    label: 'User Attributes',
    description: 'Attributes related to the user.',
    type: 'object',
    additionalProperties: true,
    defaultObjectUI: 'keyvalue',
    properties: {
      firstname: {
        label: 'First Name',
        description: 'User first name.',
        type: 'string'
      },
      lastname: {
        label: 'Last Name',
        description: 'User last name.',
        type: 'string'
      },
      mobile: {
        label: 'Mobile Number',
        description: 'User mobile number.',
        type: 'string'
      },
      billingzipcode: {
        label: 'Billing Zip Code',
        description: 'User billing zip code.',
        type: 'string'
      },
      dob: {
        label: 'Date of Birth',
        description: 'User date of birth in ISO8601 format (YYYY-MM-DD).',
        type: 'string',
        format: 'date'
      },
      gender: {
        label: 'Gender',
        description: 'User gender',
        type: 'string',
        choices: [
          { label: 'Male', value: 'm' },
          { label: 'Female', value: 'f' }
        ]
      }
    },
    default: {
      firstname: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      },
      lastname: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      },
      mobile: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      },
      billingzipcode: {
        '@if': {
          exists: { '@path': '$.traits.address.postal_code' },
          then: { '@path': '$.traits.address.postal_code' },
          else: { '@path': '$.properties.address.postal_code' }
        }
      },
      dob: {
        '@if': {
          exists: { '@path': '$.traits.birthday' },
          then: { '@path': '$.traits.birthday' },
          else: { '@path': '$.properties.birthday' }
        }
      },
      gender: {
        '@if': {
          exists: { '@path': '$.traits.gender' },
          then: { '@path': '$.traits.gender' },
          else: { '@path': '$.properties.gender' }
        }
      }
    }
  },
  ip: {
    label: 'IP Address',
    description: 'IP address of the user.',
    type: 'string',
    default: { '@path': '$.context.ip' }
  },
  audienceDetails: {
    label: 'Audience Details',
    description:
      'Details of the audience to add the user to or remove the user from. If connecting to a Segment Engage Audience, leave this field empty.',
    type: 'object',
    additionalProperties: false,
    defaultObjectUI: 'keyvalue:only',
    properties: {
      customAudienceName: {
        label: 'Audience Name',
        description:
          'Name of the audience for audience membership updates. If connecting to a Segment Engage Audience leave the field empty.',
        type: 'string'
      },
      customAudienceMembership: {
        label: 'Audience Membership',
        description:
          'Boolean indicating whether the user is a member of the audience. If connecting to a Segment Engage Audience leave this field empty.',
        type: 'boolean'
      }
    },
    default: {
      customAudienceName: { '@path': '$.properties.audience_name' },
      customAudienceMembership: { '@path': '$.properties.audience_membership' }
    }
  },
  engageAudienceName: {
    label: 'Audience Name',
    description:
      'Name of the audience for audience membership updates. If connecting to a Segment Engage Audience, leave the detault mapping as is.',
    type: 'string',
    unsafe_hidden: true,
    default: { '@path': '$.context.personas.computation_key' }
  },
  traitsOrProps: {
    label: 'Traits or properties object',
    description: 'Object that contains audience name and value.',
    type: 'object',
    unsafe_hidden: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties' },
        then: { '@path': '$.properties' },
        else: { '@path': '$.traits' }
      }
    }
  },
  computationAction: {
    label: 'Segment Computation Action',
    description: 'Hidden field used to verify that the payload is generated by an Audience.',
    type: 'string',
    choices: [
      { label: 'audience', value: 'audience' },
      { label: 'journey_step', value: 'journey_step' }
    ],
    unsafe_hidden: true,
    default: { '@path': '$.context.personas.computation_class' }
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    required: false,
    default: 100,
    maximum: 100,
    minimum: 1,
    unsafe_hidden: true
  },
  enable_batching: {
    label: 'Enable Batching',
    description: 'Enable sending events in batches.',
    type: 'boolean',
    default: true,
    unsafe_hidden: true
  },
  rtid: {
    label: 'RTID',
    description:
      "ROKT RTID value from the page URL. The 'Rokt Browser Plugin' Action automatically captures this value from the querystring in the browser, then passes it to this field.",
    type: 'string',
    required: false,
    default: {
      '@liquid':
        "{% assign rokt_rtid = integrations['Rokt Conversions API'].rtid %}{% if rokt_rtid %}{{ rokt_rtid }}{% else %}{% assign parts = context.page.search | split: 'rtid=' %}{% if parts[1] %}{{ parts[1] | split: '&' | first }}{% endif %}{% endif %}"
    }
  }
}
