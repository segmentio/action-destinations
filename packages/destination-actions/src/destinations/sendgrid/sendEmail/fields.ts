import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  domain: {
    label: 'Validated Domain',
    description:
      'The domain to use for the email. This field is optional but recommended. If you do not provide a domain, Sendgrid will attempt to send the email based on the from address, and may fail if the domain in the from address is not validated.',
    type: 'string',
    required: false,
    dynamic: true,
    disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
  },
  from: {
    label: 'From',
    description: 'From details.',
    type: 'object',
    required: true,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      email: {
        label: 'Email',
        description: 'The email address of the sender.',
        type: 'string',
        required: true
      },
      name: {
        label: 'Name',
        description: 'From name of the sender, displayed to the recipient.',
        type: 'string',
        required: false
      }
    },
    default: {
      email: {
        '@path': '$.properties.from_email'
      },
      name: {
        '@path': '$.properties.from_name'
      }
    }
  },
  to: {
    label: 'To',
    description: 'Recipient details.',
    type: 'object',
    multiple: true,
    required: true,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      email: {
        label: 'Email',
        description: 'The email address of the recipient.',
        type: 'string',
        required: true
      },
      name: {
        label: 'Name',
        description: 'The name of the recipient.',
        type: 'string',
        required: false
      }
    },
    default: {
      '@arrayPath': [
        '$.properties',
        {
          email: {
            '@path': '$.email'
          },
          name: {
            '@path': '$.name'
          }
        }
      ]
    }
  },
  cc: {
    label: 'CC',
    description: 'CC recipient details',
    type: 'object',
    multiple: true,
    required: false,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      email: {
        label: 'Email',
        description: 'The email address of the CC recipient.',
        type: 'string',
        required: true
      },
      name: {
        label: 'Name',
        description: 'The name of the CC recipient.',
        type: 'string',
        required: false
      }
    }
  },
  bcc: {
    label: 'BCC',
    description: 'BCC recipient details',
    type: 'object',
    multiple: true,
    required: false,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      email: {
        label: 'Email',
        description: 'The email address of the BCC recipient.',
        type: 'string',
        required: true
      },
      name: {
        label: 'Name',
        description: 'The name of the BCC recipient.',
        type: 'string',
        required: false
      }
    }
  },
  headers: {
    label: 'Headers',
    description: 'Headers for the email.',
    type: 'object',
    required: false,
    additionalProperties: true,
    defaultObjectUI: 'keyvalue'
  },
  dynamic_template_data: {
    label: 'Dynamic Template Data',
    description:
      'A collection of property names that will be substituted by their corresponding property values in the subject, reply-to and content portions of a SendGrid Dynamic Template.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue',
    additionalProperties: true,
    dynamic: true
  },
  template_id: {
    label: 'Dynamic Template',
    description: 'The Dynamic Template to use for the email.',
    type: 'string',
    required: true,
    dynamic: true,
    disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
  },
  custom_args: {
    label: 'Custom Args',
    description: 'Custom arguments for the email.',
    type: 'object',
    required: false,
    additionalProperties: true,
    defaultObjectUI: 'keyvalue'
  },
  send_at: {
    label: 'Send At',
    description:
      'The time to send the email. ISO 8601 format. E.g. 2024-09-23T12:00:00Z. A send cannot be scheduled more than 72 hours in advance.',
    type: 'string',
    format: 'date-time',
    required: false
  },
  reply_to: {
    label: 'Reply To',
    description: "Reply to details. If left empty 'Reply To' settings will be taken from the 'From' field values.",
    type: 'object',
    required: false,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      email: {
        label: 'Email',
        description: 'The email to reply to.',
        type: 'string',
        required: false
      },
      name: {
        label: 'Name',
        description: 'The name to reply to.',
        type: 'string',
        required: false
      }
    }
  },
  categories: {
    label: 'Categories',
    description: 'Categories for the email. Accepts a single string or array of strings.',
    type: 'string',
    multiple: true,
    required: false
  },
  ip_pool_name: {
    label: 'IP Pool',
    description: 'Send email with an ip pool.',
    type: 'string',
    required: false,
    dynamic: true,
    disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
  },
  group_id: {
    label: 'Group ID',
    description: 'Specify a Group ID',
    type: 'string',
    required: false,
    dynamic: true,
    disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
  }
}
