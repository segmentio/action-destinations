import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
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
    subject: {
      label: 'Subject',
      description: 'The subject of the email.',
      type: 'string',
      required: true
    },
    headers: {
      label: 'Headers',
      description: 'Headers for the email.',
      type: 'object',
      required: false,
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
    },
    dynamic_template_data: {
      label: 'Dynamic Template Data',
      description: 'A collection property names that will be substituted by their corresponding property values in the subject, reply-to and content portions of a SendGrid Dynamic Template.',
      type: 'object',
      multiple: true,
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      properties: {
        key: {
          label: 'Key',
          description: 'The key of the dynamic template data.',
          type: 'string',
          required: true
        },
        value: {
          label: 'Value',
          description: 'The value of the dynamic template data.',
          type: 'string',
          required: true
        },
        required: {
          label: 'Required',
          description: 'If true, the email will not be sent if the Value field is empty, unless there is a default specified.',
          type: 'boolean',
          required: true,
          default: false
        }, 
        default: {
          label: 'Default value',
          description: 'The default value to use if the value field is empty.',
          type: 'string',
          required: false
        }
      }
    }, 
    template_id: {
      label: 'Template ID',
      description: "The template ID to use for the email. This must be for a Dynamic Template and should start with a 'd-'",
      type: 'string',
      required: true
    },
    custom_args: {
      label: 'Custom Args',
      description: 'Custom arguments for the email.',
      type: 'object',
      required: false,
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
    },
    send_at: {
      label: 'Send At',
      description: 'The time to send the email. ISO 8601 format. E.g. 2024-09-23T12:00:00Z. A send cannot be scheduled more than 72 hours in advance.',
      type: 'string',
      format: 'date-time',
      required: false,
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
          required: true,
          default: true
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
      }
    },
    click_tracking: {
      label: 'Click Tracking',
      description: 'Click tracking settings for the email.',
      type: 'object',
      required: false,
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      properties: {
        enable: {
          label: 'Enabled',
          description: 'Indicates if this setting is enabled',
          type: 'boolean',
          required: true,
          default: true
        },
        enable_text:{
          label: 'Enable Text',
          description: 'Indicates if this setting should be included in the text/plain portion of your email.',
          type: 'boolean',
          required: false,
          default: false
        }
      }
    },
    open_tracking: {
      label: 'Open Tracking',
      description: 'Allows you to track if the email was opened by including a single transparent pixel image in the body of the message content.',
      type: 'object',
      required: false,
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      properties: {
        enable: {
          label: 'Enabled',
          description: 'Indicates if this setting is enabled',
          type: 'boolean',
          required: true,
          default: true
        },
        substitution_tag:{
          label: 'Substitution Tag',
          description: 'Allows you to specify a substitution tag that you can insert in the body of your email at a location that you desire. This tag will be replaced by the open tracking pixel.',
          type: 'string',
          required: false
        }
      }
    },
    subscription_tracking: {
      label: 'Subscription Tracking',
      description: 'Allows you to insert a subscription management link at the bottom of the text and HTML bodies of your email.',
      type: 'object',
      required: false,
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      properties: {
        enable: {
          label: 'Enabled',
          description: 'Indicates if this setting is enabled',
          type: 'boolean',
          required: true,
          default: false
        },
        text:{
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
          description: 'A tag that will be replaced with the unsubscribe URL. If this property is used, it will override both the text and html properties.',
          type: 'string',
          required: false
        }
      }
    },
    categories: {
      label: 'Categories',
      description: 'Categories for the email.',
      type: 'object',
      multiple: true,
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: false,
      properties: {
        category: {
          label: 'Category name',
          description: 'Category name.',
          type: 'string',
          required: true
        }
      }
    },
    googleAnalytics: {
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
          required: true,
          default: false
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
      }
    },
    ipPoolName: {
      label: 'IP Pool',
      description: 'Send email with an ip pool.',
      type: 'string',
      required: false
    },
    ASM: {
      label: 'Subscription Settings',
      description: 'Subscription settings for the email.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: false,
      properties: {
        groupId: {
          label: 'Subscription Group ID',
          description: 'Specify a Subscription Group ID to ensure emails are sent to only users who are subscribed to that group.',
          type: 'integer',
          required: false
        }
      }
    },
    mail_settings: {
      label: 'Mail Settings',
      description: 'A collection of different mail settings that you can use to specify how you would like this email to be handled.',
      type: 'object',
      required: false,
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      properties: {
        bypass_list_management: {
          label: 'Bypass List Management',
          description: 'Allows you to bypass all unsubscribe groups and suppressions to ensure that the email is delivered to every single recipient.',
          type: 'boolean',
          required: false,
          default: false
        },
        bypass_unsubscribe_management: {
          label: 'Bypass Unsubscribe Management',
          description: 'Allows you to bypass the global unsubscribe list to ensure that the email is delivered to recipients. This filter applies only to global unsubscribes and will not bypass group unsubscribes. This filter cannot be combined with the bypass_list_management.',
          type: 'boolean',
          required: false,
          default: false
        },
        sandbox_mode: {
          label: 'Sandbox Mode',
          description: 'Sandbox Mode allows you to send a test email to ensure that your request body is valid and formatted correctly.',
          type: 'boolean',
          required: false,
          default: false
        }
      }
    }
}