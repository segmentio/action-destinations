import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  domain: {
    label: 'Validated Domain',
    description:
      'The domain to use for the email. This field is optional but recommended. If you do not provide a domain, Sendgrid will attempt to send the email based on the from address, and may fail if the domain in the from address is not validated.',
    type: 'string',
    required: false,
    dynamic: true
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
    additionalProperties: true
  },
  template_id: {
    label: 'Template ID',
    description:
      "The template ID to use for the email. This must be for a Dynamic Template and should start with a 'd-'",
    type: 'string',
    required: true,
    dynamic: true
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
    description: 'Reply to details.',
    type: 'object',
    required: true,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      reply_to_equals_from: {
        label: 'Reply To Equals From',
        description: 'Whether "reply to" settings are the same as "from"',
        type: 'boolean',
        required: true
      },
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
    },
    default: {
      reply_to_equals_from: true
    }
  },
  subscription_tracking: {
    label: 'Subscription Tracking',
    description:
      'Allows you to insert a subscription management link at the bottom of the text and HTML bodies of your email.',
    type: 'object',
    required: false,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      enable: {
        label: 'Enabled',
        description: 'Indicates if this setting is enabled',
        type: 'boolean',
        required: true
      },
      text: {
        label: 'Text',
        description: 'Text to be appended to the email with the subscription tracking link.',
        type: 'string',
        required: false
      },
      html: {
        label: 'HTML',
        description: 'HTML to be appended to the email with the subscription tracking link.',
        type: 'string',
        required: false
      },
      substitution_tag: {
        label: 'Substitution Tag',
        description:
          'A tag that will be replaced with the unsubscribe URL. If this property is used, it will override both the text and html properties.',
        type: 'string',
        required: false
      }
    },
    default: {
      enable: false
    }
  },
  categories: {
    label: 'Categories',
    description: 'Categories for the email.',
    type: 'string',
    multiple: true,
    required: false
  },
  google_analytics: {
    label: 'Google Analytics',
    description: 'Allows you to enable tracking provided by Google Analytics.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue',
    additionalProperties: false,
    properties: {
      enable: {
        label: 'Enabled',
        description: 'Indicates if this setting is enabled',
        type: 'boolean',
        required: true
      },
      utm_source: {
        label: 'UTM Source',
        description: 'Name of the referrer source. (e.g., Google, SomeDomain.com, or Marketing Email)',
        type: 'string',
        required: false
      },
      utm_medium: {
        label: 'UTM Medium',
        description: 'Name of the marketing medium. (e.g., Email)',
        type: 'string',
        required: false
      },
      utm_term: {
        label: 'UTM Term',
        description: 'Used to identify any paid keywords.',
        type: 'string',
        required: false
      },
      utm_content: {
        label: 'UTM Content',
        description: 'Used to differentiate your campaign from advertisements.',
        type: 'string',
        required: false
      },
      utm_campaign: {
        label: 'UTM Campaign',
        description: 'The name of the campaign.',
        type: 'string',
        required: false
      }
    },
    default: {
      enable: true,
      utm_source: { '@path': '$.context.campaign.source' },
      utm_medium: { '@path': '$.context.campaign.medium' },
      utm_term: { '@path': '$.context.campaign.term' },
      utm_content: { '@path': '$.context.campaign.content' },
      utm_campaign: { '@path': '$.context.campaign.name' }
    }
  },
  ip_pool_name: {
    label: 'IP Pool',
    description: 'Send email with an ip pool.',
    type: 'string',
    required: false,
    dynamic: true
  },
  group_id: {
    label: 'Group ID',
    description: 'Specify a Group ID',
    type: 'string',
    required: false,
    dynamic: true
  },
  sandbox_mode: {
    label: 'Sandbox Mode',
    description:
      'Sandbox Mode allows you to send a test email to ensure that your request body is valid and formatted correctly.',
    type: 'boolean',
    required: false
  }
}
