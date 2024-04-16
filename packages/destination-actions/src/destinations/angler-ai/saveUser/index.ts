import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseURL, customersEndpoint } from '../utils'
import { InputField } from '@segment/actions-core/destination-kittypes'

const addressProperties: Record<string, InputField> = {
  id: {
    label: 'ID',
    type: 'string',
    description: 'A unique identifier for the address.'
  },
  address1: {
    label: 'Address 1',
    type: 'string',
    description: "The customer's mailing address."
  },
  address2: {
    label: 'Address 2',
    type: 'string',
    description: "An additional field for the customer's mailing address."
  },
  city: {
    label: 'City',
    type: 'string',
    description: "The customer's city, town, or village."
  },
  company: {
    label: 'Company',
    type: 'string',
    description: "The customer's company."
  },
  country: {
    label: 'Country',
    type: 'string',
    description: "The customer's country."
  },
  country_code: {
    label: 'Country Code',
    type: 'string',
    description: "The two-letter country code corresponding to the customer's country"
  },
  country_name: {
    label: 'Country Name',
    type: 'string',
    description: "The customer's normalized country name."
  },
  customer_id: {
    label: 'Customer ID',
    type: 'string',
    description: 'A unique identifier for the customer.'
  },
  default: {
    label: 'Default',
    type: 'boolean',
    description: 'Whether this address is the default address for the customer.'
  },
  first_name: {
    label: 'First Name',
    type: 'string',
    description: "The customer's first name."
  },
  last_name: {
    label: 'Last Name',
    type: 'string',
    description: "The customer's last name."
  },
  name: {
    label: 'Name',
    type: 'string',
    description: "The customer's first and last names."
  },
  phone: {
    label: 'Phone',
    type: 'string',
    description: "The customer's phone number at this address."
  },
  province: {
    label: 'Province',
    type: 'string',
    description: "The customer's region name. Typically a province, a state, or a prefecture"
  },
  province_code: {
    label: 'Province Code',
    type: 'string',
    description:
      'The code for the region of the address, such as the province, state, or district. For example QC for Quebec, Canada.'
  },
  zip: {
    label: 'Zip',
    type: 'string',
    description: "The customer's postal code, also known as zip, postcode, Eircode, etc"
  },
  hashed_first_name: {
    label: 'Hashed First Name',
    type: 'string',
    description: 'Hashed value of first name in SHA256 (lower case).'
  },
  hashed_last_name: {
    label: 'Hashed Last Name',
    type: 'string',
    description: 'Hashed value of last name in SHA256 (lower case).'
  },
  hashed_phone: {
    label: 'Hashed Phone',
    type: 'string',
    description: 'Hashed value of phone in SHA256 (lower case).'
  },
  hashed_address1: {
    label: 'Hashed Address 1',
    type: 'string',
    description: 'Hashed value of address1 in SHA256 (lower case).'
  },
  hashed_address2: {
    label: 'Hashed Address 2',
    type: 'string',
    description: 'Hashed value of address2 in SHA256 (lower case).'
  },
  hashed_city: {
    label: 'Hashed City',
    type: 'string',
    description: 'Hashed value of city in SHA256 (lower case).'
  },
  hashed_zip: {
    label: 'Hashed Zip',
    type: 'string',
    description: 'Hashed value of zip in SHA256 (lower case).'
  },
  hashed_country_code: {
    label: 'Hashed Country Code',
    type: 'string',
    description: 'Hashed value of country code in SHA256 (lower case).'
  }
}

const addressDefaultFields = {
  id: { '@path': 'id' },
  address1: { '@path': 'address1' },
  address2: { '@path': 'address2' },
  city: { '@path': 'city' },
  company: { '@path': 'company' },
  country: { '@path': 'country' },
  country_code: { '@path': 'country_code' },
  country_name: { '@path': 'country_name' },
  customer_id: { '@path': 'customer_id' },
  default: { '@path': 'default' },
  first_name: { '@path': 'first_name' },
  last_name: { '@path': 'last_name' },
  name: { '@path': 'name' },
  phone: { '@path': 'phone' },
  province: { '@path': 'province' },
  province_code: { '@path': 'province_code' },
  zip: { '@path': 'zip' },
  hashed_first_name: { '@path': 'hashed_first_name' },
  hashed_last_name: { '@path': 'hashed_last_name' },
  hashed_phone: { '@path': 'hashed_phone' },
  hashed_address1: { '@path': 'hashed_address1' },
  hashed_address2: { '@path': 'hashed_address2' },
  hashed_city: { '@path': 'hashed_city' },
  hashed_zip: { '@path': 'hashed_zip' },
  hashed_country_code: { '@path': 'hashed_country_code' }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save User',
  description: '',
  fields: {
    accepts_marketing: {
      label: 'Accepts Marketing',
      type: 'boolean',
      description: 'Whether the customer has consented to receive marketing material by email.',
      default: {
        '@path': '$.traits.accepts_marketing'
      }
    },
    accepts_marketing_updated_at: {
      label: 'Accepts Marketing Updated At',
      type: 'string',
      description:
        'The date and time (ISO 8601 format) when the customer consented or objected to receiving marketing material by email.',
      default: {
        '@path': '$.traits.accepts_marketing_updated_at'
      }
    },
    addresses: {
      label: 'Addresses',
      type: 'object',
      description: 'A list of the ten most recently updated addresses for the customer.',
      multiple: true,
      properties: addressProperties,
      default: {
        '@arrayPath': ['$.traits.addresses', addressDefaultFields]
      }
    },
    currency: {
      label: 'Currency',
      type: 'string',
      description:
        'The three-letter code (ISO 4217 format) for the currency that the customer used when they paid for their last order.',
      default: {
        '@path': '$.traits.currency'
      }
    },
    created_at: {
      label: 'Created At',
      type: 'string',
      description: 'The date and time (ISO 8601 format) when the customer was created.',
      default: {
        '@path': '$.traits.created_at'
      }
    },
    default_address: {
      label: 'Default Address',
      type: 'object',
      description: 'The mailing address associated with the payment method.',
      properties: addressProperties,
      default: {
        '@arrayPath': ['$.traits.default_address', addressDefaultFields]
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'The unique email address of the customer.',
      default: {
        '@path': '$.traits.email'
      }
    },
    hashed_email: {
      label: 'Hashed Email',
      type: 'string',
      description: "Hashed customer's email in SHA256 (lower case).",
      default: {
        '@path': '$.traits.hashed_email'
      }
    },
    hashed_first_name: {
      label: 'Hashed First Name',
      type: 'string',
      description: "Hashed customer's first name in SHA256 (lower case).",
      default: {
        '@path': '$.traits.hashed_first_name'
      }
    },
    hashed_last_name: {
      label: 'Hashed Last Name',
      type: 'string',
      description: "Hashed customer's last name in SHA256 (lower case).",
      default: {
        '@path': '$.traits.hashed_last_name'
      }
    },
    hashed_phone: {
      label: 'Hashed Phone',
      type: 'string',
      description: "Hashed customer's phone in SHA256 (lower case).",
      default: {
        '@path': '$.traits.hashed_phone'
      }
    },
    email_marketing_consent: {
      label: 'Email Marketing Consent',
      type: 'object',
      description:
        'The marketing consent information when the customer consented to receiving marketing material by email.',
      properties: {
        state: {
          label: 'State',
          type: 'string',
          description: 'The current email marketing state for the customer.'
        },
        opt_in_level: {
          label: 'Opt In Level',
          type: 'string',
          description:
            'The marketing subscription opt-in level, as described in the M3AAWG Sender Best Common Practices, that the customer gave when they consented to receive marketing material by email.'
        },
        consent_updated_at: {
          label: 'Consent Updated At',
          type: 'string',
          description:
            'The date and time when the customer consented to receive marketing material by email. If no date is provided, then the date and time when the consent information was sent is used.'
        }
      },
      default: {
        '@arrayPath': [
          '$.traits.email_marketing_consent',
          {
            state: { '@path': 'state' },
            opt_in_level: { '@path': 'opt_in_level' },
            consent_updated_at: { '@path': 'consent_updated_at' }
          }
        ]
      }
    },
    first_name: {
      label: 'First Name',
      type: 'string',
      description: "The customer's first name.",
      default: {
        '@path': '$.traits.first_name'
      }
    },
    id: {
      label: 'ID',
      type: 'string',
      description: 'A unique identifier for the customer.',
      default: {
        '@path': '$.traits.id'
      }
    },
    last_name: {
      label: 'Last Name',
      type: 'string',
      description: "The customer's last name.",
      default: {
        '@path': '$.traits.last_name'
      }
    },
    last_order_id: {
      label: 'Last Order ID',
      type: 'string',
      description: "The ID of the customer's last order.",
      default: {
        '@path': '$.traits.last_order_id'
      }
    },
    last_order_name: {
      label: 'Last Order Name',
      type: 'string',
      description: "The name of the customer's last order.",
      default: {
        '@path': '$.traits.last_order_name'
      }
    },
    metafield: {
      label: 'Metafield',
      type: 'object',
      description: "Attaches additional metadata to a shop's resources.",
      properties: {
        key: {
          label: 'Key',
          type: 'string',
          description: 'An identifier for the metafield.'
        },
        namespace: {
          label: 'Namespace',
          type: 'string',
          description:
            'A container for a set of metadata. Namespaces help distinguish between metadata that you created and metadata created by another individual with a similar namespace.'
        },
        value: {
          label: 'Value',
          type: 'string',
          description: 'Information to be stored as metadata.'
        },
        type: {
          label: 'Type',
          type: 'string',
          description: 'The type.'
        }
      },
      default: {
        '@arrayPath': [
          '$.traits.metafield',
          {
            key: { '@path': 'key' },
            namespace: { '@path': 'namespace' },
            value: { '@path': 'value' },
            type: { '@path': 'type' }
          }
        ]
      }
    },
    marketing_opt_in_level: {
      label: 'Marketing Opt In Level',
      type: 'string',
      description:
        'The marketing subscription opt-in level, as described in the M3AAWG Sender Best Common Practices, that the customer gave when they consented to receive marketing material by email.',
      default: {
        '@path': '$.traits.marketing_opt_in_level'
      }
    },
    note: {
      label: 'Note',
      type: 'string',
      description: 'A note about the customer.',
      default: {
        '@path': '$.traits.note'
      }
    },
    orders_count: {
      label: 'Orders Count',
      type: 'number',
      description: 'The number of orders associated with this customer.',
      default: {
        '@path': '$.traits.orders_count'
      }
    },
    phone: {
      label: 'Phone',
      type: 'string',
      description: 'The unique phone number (E.164 format) for this customer.',
      default: {
        '@path': '$.traits.phone'
      }
    },
    sms_marketing_consent: {
      label: 'SMS Marketing Consent',
      type: 'object',
      description:
        'The marketing consent information when the customer consented to receiving marketing material by SMS.',
      properties: {
        state: {
          label: 'State',
          type: 'string',
          description: 'The state of the SMS marketing consent.'
        },
        opt_in_level: {
          label: 'Opt In Level',
          type: 'string',
          description:
            'The marketing subscription opt-in level, as described in the M3AAWG Sender Best Common Practices, that the customer gave when they consented to receive marketing material by SMS.'
        },
        consent_updated_at: {
          label: 'Consent Updated At',
          type: 'string',
          description:
            'The date and time when the customer consented to receive marketing material by SMS. If no date is provided, then the date and time when the consent information was sent is used.'
        },
        consent_collected_from: {
          label: 'Consent Collected From',
          type: 'string',
          description: 'The source for whether the customer has consented to receive marketing material by SMS.'
        }
      },
      default: {
        '@arrayPath': [
          '$.traits.sms_marketing_consent',
          {
            state: { '@path': 'state' },
            opt_in_level: { '@path': 'opt_in_level' },
            consent_updated_at: { '@path': 'consent_updated_at' },
            consent_collected_from: { '@path': 'consent_collected_from' }
          }
        ]
      }
    },
    state: {
      label: 'State',
      type: 'string',
      choices: [
        { value: 'ENABLED', label: 'Enabled' },
        { value: 'DISABLED', label: 'Disabled' },
        { value: 'INVITED', label: 'Invited' },
        { value: 'DECLINED', label: 'Declined' }
      ],
      description: "The state of the customer's account with a shop.",
      default: {
        '@path': '$.traits.state'
      }
    },
    tags: {
      label: 'Tags',
      type: 'string',
      description:
        'Tags that the shop owner has attached to the customer, formatted as a string of comma-separated values.',
      default: {
        '@path': '$.traits.tags'
      }
    },
    tax_exempt: {
      label: 'Tax Exempt',
      type: 'boolean',
      description: 'Whether the customer is exempt from paying taxes on their order.',
      default: {
        '@path': '$.traits.tax_exempt'
      }
    },
    total_spent: {
      label: 'Total Spent',
      type: 'string',
      description: 'The total amount of money that the customer has spent across their order history.',
      default: {
        '@path': '$.traits.total_spent'
      }
    },
    updated_at: {
      label: 'Updated At',
      type: 'string',
      description: 'The date and time (ISO 8601 format) when the customer information was last updated.',
      default: {
        '@path': '$.traits.updated_at'
      }
    },
    verified_email: {
      label: 'Verified Email',
      type: 'boolean',
      description: 'Whether the customer has verified their email address.',
      default: {
        '@path': '$.traits.verified_email'
      }
    },
    additional_fields: {
      label: 'Additional Fields',
      type: 'object',
      multiple: true,
      description: 'Extra properties.',
      properties: {
        name: {
          label: 'Name',
          type: 'string',
          description: 'Extra property name.'
        },
        value: {
          label: 'Value',
          type: 'string',
          description: 'Extra property value.'
        }
      },
      default: {
        '@path': '$.traits.additional_fields'
      }
    }
  },
  perform: (request, data) => {
    const payload = {
      src: 'SEGMENT',
      data: [data.payload]
    }
    return request(baseURL + customersEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
