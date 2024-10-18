import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Email',
  description: 'Send email to a recipient.',
  fields: {
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
          required: true
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
      multiple: true,
      required: false,
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
      multiple: true,
      required: false,
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
    },
    send_at: {
      label: 'Send At',
      description: 'The time to send the email. ISO 8601 format. E.g. 2024-09-23T12:00:00Z',
      type: 'string',
      format: 'date-time',
      required: false
    },





    replyTo: {
      label: 'Reply To',
      description: 'Reply to details.',
      type: 'object',
      required: true, 
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      properties: {
        replyToEqualsFrom: {
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
    previewText: {
      label: 'Preview Text',
      description: 'Preview Text',
      type: 'string'
    },


    trackingSettings: {
      label: 'Tracking Settings',
      description: 'Tracking settings for the email.',
      type: 'object',
      required: false,
      additionalProperties: false,
      properties: {
        openTracking: {
          label: 'Open Tracking',
          description: 'Enable open tracking',
          type: 'boolean',
          required: false,
          default: true
        },
        clickTracking:{
          label: 'Click Tracking',
          description: 'Enable click tracking',
          type: 'boolean',
          required: false,
          default: true
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
          type: 'string'
        }
      }
    },
    sandboxMode: {
      label: 'Sandbox Mode',
      description: 'Enable sandbox mode. If true, the email will not actually be sent, but will be validated.',
      type: 'boolean',
      required: true,
      default: false
    },
    ipPool: {
      label: 'IP Pool',
      description: 'Send email with an ip pool.',
      type: 'string',
      required: false
    },
    subscriptionSettings: {
      label: 'Subscription Settings',
      description: 'Subscription settings for the email.',
      type: 'object',
      required: false,
      additionalProperties: false,
      properties: {
        groupId: {
          label: 'Subscription Group ID',
          description: 'Specify a Subscription Group ID to ensure emails are sent to only users who are subscribed to that group.',
          type: 'string',
          required: false
        },
        byPassSubscription: {
          label: 'By Pass Subscription',
          description: 'Send email without subscription check.',
          type: 'boolean',
          required: false,
          default: false
        }
      }
    },
    bypassListManagement: {
      label: 'Bypass List Management',
      description: 'Send email without subscription check.',
      type: 'boolean',
      required: false,
      default: false
    }
  },
  perform: (request, data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
