import type { InputField } from '@segment/actions-core'
import { addressDefaultFields, addressProperties } from './addressFields'

export const userFields: Record<string, InputField> = {
  user: {
    type: 'object',
    label: 'User',
    description: 'The user object.',
    defaultObjectUI: 'keyvalue',
    additionalProperties: true,
    properties: {
      accepts_marketing: {
        label: 'Accepts Marketing',
        type: 'boolean',
        description: 'Whether the customer has consented to receive marketing material by email.'
      },
      accepts_marketing_updated_at: {
        label: 'Accepts Marketing Updated At',
        type: 'string',
        description:
          'The date and time (ISO 8601 format) when the customer consented or objected to receiving marketing material by email.'
      },
      currency: {
        label: 'Currency',
        type: 'string',
        description:
          'The three-letter code (ISO 4217 format) for the currency that the customer used when they paid for their last order.'
      },
      created_at: {
        label: 'Created At',
        type: 'string',
        description: 'The date and time (ISO 8601 format) when the customer was created.'
      },
      email: {
        label: 'Email',
        type: 'string',
        description: 'The unique email address of the customer.'
      },
      hashed_email: {
        label: 'Hashed Email',
        type: 'string',
        description: "Hashed customer's email in SHA256 (lower case)."
      },
      hashed_first_name: {
        label: 'Hashed First Name',
        type: 'string',
        description: "Hashed customer's first name in SHA256 (lower case)."
      },
      hashed_last_name: {
        label: 'Hashed Last Name',
        type: 'string',
        description: "Hashed customer's last name in SHA256 (lower case)."
      },
      hashed_phone: {
        label: 'Hashed Phone',
        type: 'string',
        description: "Hashed customer's phone in SHA256 (lower case)."
      },
      first_name: {
        label: 'First Name',
        type: 'string',
        description: "The customer's first name."
      },
      id: {
        label: 'ID',
        type: 'string',
        description: 'A unique identifier for the customer.'
      },
      last_name: {
        label: 'Last Name',
        type: 'string',
        description: "The customer's last name."
      },
      last_order_id: {
        label: 'Last Order ID',
        type: 'string',
        description: "The ID of the customer's last order."
      },
      last_order_name: {
        label: 'Last Order Name',
        type: 'string',
        description: "The name of the customer's last order."
      },
      marketing_opt_in_level: {
        label: 'Marketing Opt In Level',
        type: 'string',
        description:
          'The marketing subscription opt-in level, as described in the M3AAWG Sender Best Common Practices, that the customer gave when they consented to receive marketing material by email.'
      },
      note: {
        label: 'Note',
        type: 'string',
        description: 'A note about the customer.'
      },
      orders_count: {
        label: 'Orders Count',
        type: 'number',
        description: 'The number of orders associated with this customer.'
      },
      phone: {
        label: 'Phone',
        type: 'string',
        description: 'The unique phone number (E.164 format) for this customer.'
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
        description: "The state of the customer's account with a shop."
      },
      tax_exempt: {
        label: 'Tax Exempt',
        type: 'boolean',
        description: 'Whether the customer is exempt from paying taxes on their order.'
      },
      total_spent: {
        label: 'Total Spent',
        type: 'string',
        description: 'The total amount of money that the customer has spent across their order history.'
      },
      updated_at: {
        label: 'Updated At',
        type: 'string',
        description: 'The date and time (ISO 8601 format) when the customer information was last updated.'
      },
      verified_email: {
        label: 'Verified Email',
        type: 'boolean',
        description: 'Whether the customer has verified their email address.'
      }
    },
    default: {
      accepts_marketing: { '@path': '$.traits.accepts_marketing' },
      accepts_marketing_updated_at: { '@path': '$.traits.accepts_marketing_updated_at' },
      currency: { '@path': '$.traits.currency' },
      created_at: { '@path': '$.traits.created_at' },
      email: { '@path': '$.traits.email' },
      hashed_email: { '@path': '$.traits.hashed_email' },
      hashed_first_name: { '@path': '$.traits.hashed_first_name' },
      hashed_last_name: { '@path': '$.traits.hashed_last_name' },
      hashed_phone: { '@path': '$.traits.hashed_phone' },
      first_name: { '@path': '$.traits.first_name' },
      id: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.traits.id' }
        }
      },
      last_name: { '@path': '$.traits.last_name' },
      last_order_id: { '@path': '$.traits.last_order_id' },
      last_order_name: { '@path': '$.traits.last_order_name' },
      marketing_opt_in_level: { '@path': '$.traits.marketing_opt_in_level' },
      note: { '@path': '$.traits.note' },
      orders_count: { '@path': '$.traits.orders_count' },
      phone: { '@path': '$.traits.phone' },
      state: { '@path': '$.traits.state' },
      tax_exempt: { '@path': '$.traits.tax_exempt' },
      total_spent: { '@path': '$.traits.total_spent' },
      updated_at: { '@path': '$.traits.updated_at' },
      verified_email: { '@path': '$.traits.verified_email' }
    }
  },
  addresses: {
    label: 'Addresses',
    type: 'object',
    description: 'A list of the ten most recently updated addresses for the customer.',
    multiple: true,
    properties: addressProperties,
    default: {
      '@arrayPath': ['$.traits.addresses', addressDefaultFields('$')]
    }
  },
  default_address: {
    label: 'Default Address',
    type: 'object',
    description: 'The mailing address associated with the payment method.',
    properties: addressProperties,
    default: addressDefaultFields('$.traits.default_address.')
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
          state: { '@path': '$.state' },
          opt_in_level: { '@path': '$.opt_in_level' },
          consent_updated_at: { '@path': '$.consent_updated_at' }
        }
      ]
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
          key: { '@path': '$.key' },
          namespace: { '@path': '$.namespace' },
          value: { '@path': '$.value' },
          type: { '@path': '$.type' }
        }
      ]
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
          state: { '@path': '$.state' },
          opt_in_level: { '@path': '$.opt_in_level' },
          consent_updated_at: { '@path': '$.consent_updated_at' },
          consent_collected_from: { '@path': '$.consent_collected_from' }
        }
      ]
    }
  }
}
