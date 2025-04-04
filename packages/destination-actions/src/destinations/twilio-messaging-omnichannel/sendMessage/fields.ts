import { InputField } from '@segment/actions-core'
import { DependsOnConditions } from '@segment/actions-core/destination-kittypes'

const DEPENDS_ON_MESSAGE_ADDRESS_SENDER: DependsOnConditions = {
  match: 'all',
  conditions: [
    {
      fieldKey: 'from',
      operator: 'is',
      value: 'MessageAddressSender'
    }
  ]
}

const DEPENDS_ON_AGENT_ID_SENDER: DependsOnConditions = {
  match: 'all',
  conditions: [
    {
      fieldKey: 'from',
      operator: 'is',
      value: 'AgentIdSender'
    }
  ]
}

const DEPENDS_ON_AGENT_POOL_ID_SENDER: DependsOnConditions = {
  match: 'all',
  conditions: [
    {
      fieldKey: 'from',
      operator: 'is',
      value: 'AgentPoolIdSender'
    }
  ]
}

const DEPENDS_ON_MESSAGE_CONTENT_TEXT: DependsOnConditions = {
  match: 'all',
  conditions: [
    {
      fieldKey: 'content_type',
      operator: 'is',
      value: 'MessageContentText'
    }
  ]
}

const DEPENDS_ON_MESSAGE_CONTENT_TEMPLATE: DependsOnConditions = {
  match: 'all',
  conditions: [
    {
      fieldKey: 'content_type',
      operator: 'is',
      value: 'MessageContentTemplate'
    }
  ]
}

export const fields: Record<string, InputField> = {
  fromObject: {
    type: 'object',
    label: 'From',
    description: 'Defines the fields applicable based on the selected sender type.',
    required: true,
    multiple: true,
    properties: {
      from: {
        type: 'string',
        label: 'From',
        description: 'The type of sender.',
        choices: [
          { label: 'Message Address Sender', value: 'MessageAddressSender' },
          { label: 'Agent ID Sender', value: 'AgentIdSender' },
          { label: 'Agent Pool ID Sender', value: 'AgentPoolIdSender' }
        ]
      },
      address: {
        type: 'string',
        label: 'Address',
        description: 'The identifier within a channel address space for an actor.',
        depends_on: DEPENDS_ON_MESSAGE_ADDRESS_SENDER
      },
      channel: {
        type: 'string',
        label: 'Channel',
        description: 'The channels available for the Message entity.',
        choices: [
          { label: 'Phone', value: 'phone' },
          { label: 'RCS', value: 'rcs' },
          { label: 'WhatsApp', value: 'whatsapp' },
          { label: 'Facebook Messenger', value: 'fbm' }
        ],
        depends_on: DEPENDS_ON_MESSAGE_ADDRESS_SENDER
      },
      agent_id: {
        type: 'string',
        label: 'Agent ID',
        description: 'A reference to an Agent.',
        depends_on: DEPENDS_ON_AGENT_ID_SENDER
      },
      agent_pool_id: {
        type: 'string',
        label: 'Agent Pool ID',
        description: 'A reference to an Agent Pool.',
        depends_on: DEPENDS_ON_AGENT_POOL_ID_SENDER
      }
    }
  },
  to: {
    type: 'object',
    label: 'To',
    description: 'An array of recipient objects to send the message(s) to.',
    required: true,
    multiple: true,
    properties: {
      address: {
        type: 'string',
        label: 'Address',
        description: 'The identifier within a channel address space for an actor (e.g. phone number).',
        required: true
      },
      channel: {
        type: 'string',
        label: 'Channel',
        description: 'The channels available for the Message entity.',
        choices: [
          { label: 'Phone', value: 'phone' },
          { label: 'WhatsApp', value: 'whatsapp' },
          { label: 'Facebook Messenger', value: 'fbm' }
        ],
        required: true
      },
      variables: {
        type: 'object',
        label: 'Variables',
        defaultObjectUI: 'keyvalue:only',
        description:
          'To personalize content for each recipient, supply variables here with values to substitute into any Liquid templated content string or pre-stored Content template.'
      }
    }
  },
  content: {
    type: 'object',
    label: 'Content',
    description: 'Defines the fields applicable based on the selected content type.',
    required: true,
    properties: {
      content_type: {
        type: 'string',
        label: 'Content Type',
        description: 'The type of message content.',
        choices: [
          { label: 'Text Content', value: 'MessageContentText' },
          { label: 'Template Content', value: 'MessageContentTemplate' }
        ]
      },
      text: {
        type: 'string',
        label: 'Text',
        description: 'A simple string or templated content.',
        required: true,
        depends_on: DEPENDS_ON_MESSAGE_CONTENT_TEXT
      },
      title: {
        type: 'string',
        label: 'Title',
        description: 'Optional title prepended to the message.',
        depends_on: DEPENDS_ON_MESSAGE_CONTENT_TEXT
      },
      default_variables: {
        type: 'object',
        label: 'Default Variables',
        defaultObjectUI: 'keyvalue:only',
        description: 'Default values for use within the templated content field text and title.',
        depends_on: DEPENDS_ON_MESSAGE_CONTENT_TEXT
      },
      content_id: {
        type: 'string',
        label: 'Content ID',
        description: 'A reference to a Content template.',
        required: true,
        depends_on: DEPENDS_ON_MESSAGE_CONTENT_TEMPLATE
      }
    }
  },

  channels: {
    type: 'string',
    label: 'Channels',
    description:
      'A list of eligible channels to constrain Messages to; leave undefined to send across all available channels.'
  },

  schedule: {
    type: 'object',
    label: 'Schedule',
    description: 'A schedule defines when a communication will be sent to a recipient.',
    properties: {
      send_at: {
        type: 'string',
        label: 'Send At',
        description: 'List of expressions defining when the message may be sent.'
      },
      quiet_hours: {
        type: 'string',
        label: 'Quiet Hours',
        description: 'List of expressions defining when the message may NOT be sent.'
      },
      ignore_compliances: {
        type: 'string',
        label: 'Ignore Compliances',
        description: 'List of compliance rules to ignore.',
        choices: [
          { label: 'All', value: 'all' },
          { label: 'France Marketing', value: 'france_marketing' },
          { label: 'EU All', value: 'eu_all' }
        ]
      },
      frequency_cap: {
        type: 'object',
        label: 'Frequency Cap',
        description: `Optimize the send time to prevent exceeding the count of communications sent to the recipient(s) for any time window of length period.`,
        properties: {
          count: {
            type: 'string',
            label: 'Count',
            description: 'The number of communications.'
          },
          period: {
            type: 'string',
            label: 'Period',
            description: 'The duration for calculating the frequency count.',
            default: 'P1D'
          }
        }
      },
      ttl: {
        type: 'string',
        label: 'TTL',
        description: 'Time-to-live for the communication.',
        default: 'P1D'
      }
    }
  },
  use_domain: {
    type: 'object',
    label: 'Use Domain',
    description: 'The Domain to use for wrapping links for click-tracked links and shortened links.',
    properties: {
      domain_name: {
        type: 'string',
        label: 'Domain Name',
        description: 'A fully qualified domain name (FQDN) that you have registered with your DNS provider.'
      }
    }
  },
  tags: {
    type: 'object',
    label: 'Tags',
    description:
      'Custom metadata in the form of key-value pairs. Maximum size of a tag key is 128 characters. Maximum size of a tag value is 256 characters. There can be a maximum of 10 key-value pairs.',
    defaultObjectUI: 'keyvalue:only'
  }
}
