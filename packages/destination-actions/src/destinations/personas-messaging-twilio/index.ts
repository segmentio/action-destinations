import type { DestinationDefinition, InputField } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendSms from './sendSms'

const getRange = (val: number): { value: number; label: string }[] => {
  return Array(val)
    .fill(1)
    .map((x, y) => ({ value: x + y, label: `${x + y}` }))
}

const ConnectionOverridesProperties: Record<string, InputField> = {
  ct: {
    label: 'Connection timeout',
    description: 'The timeout in milliseconds Twilio will wait to establish its TCP connection to your webserver',
    type: 'number',
    default: 5000,
    choices: getRange(10000)
  },
  rt: {
    label: 'Read timeout',
    description:
      'The amount of time in milliseconds after sending your webhook an HTTP request that Twilio will wait for the initial HTTP response packet',
    type: 'number',
    default: 15000,
    choices: getRange(15000)
  },
  tt: {
    label: 'Total timeout',
    description: 'The total time allowed for all timeouts including retries',
    type: 'number',
    default: 15000,
    choices: getRange(15000)
  },
  rc: {
    label: 'Retry count',
    description: 'The number of retry attempts Twilio will make if its connection to your webhook fails',
    type: 'number',
    default: 1,
    choices: getRange(5)
  },
  rp: {
    label: 'Retry policy',
    description: 'The type of failure to retry on',
    type: 'string',
    default: 'ct',
    choices: ['ct', '4xx', '5xx', 'rt', 'all']
  },
  sni: {
    label: 'SNI',
    description: 'The type of failure to retry on',
    type: 'string',
    default: 'unset',
    choices: ['y', 'n', 'unser']
  },
  e: {
    label: 'Edge location',
    description:
      'The Twilio edge location where webhooks egress. This can be a list and we rotate through the list as retries happen.',
    type: 'string',
    default: 'ashburn',
    choices: [
      'ashburn',
      'ashburn-ix',
      'dublin',
      'frankfurt',
      'frankfurt-ix',
      'sao-paulo',
      'singapore',
      'sydney',
      'tokyo',
      'umatilla',
      'london-ix',
      'san-jose-ix',
      'singapore-ix'
    ]
  }
}

const destination: DestinationDefinition<Settings> = {
  //The name below is creation name however in partner portal this is Actions Personas Messaging Twilio
  //This is due to integrations-consumer fetches the creation name instead of current name
  name: 'Personas Messaging Twilio (Actions)',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      twilioAccountId: {
        label: 'Twilio Account ID',
        description: 'Twilio Account ID',
        type: 'string',
        required: true
      },
      twilioAuthToken: {
        label: 'Twilio Auth Token',
        description: 'Twilio Auth Token',
        type: 'password',
        required: true
      },
      profileApiEnvironment: {
        label: 'Profile API Environment',
        description: 'Profile API Environment',
        type: 'string',
        required: true
      },
      profileApiAccessToken: {
        label: 'Profile API Access Token',
        description: 'Profile API Access Token',
        type: 'password',
        required: true
      },
      spaceId: {
        label: 'Space ID',
        description: 'Space ID',
        type: 'string',
        required: true
      },
      sourceId: {
        label: 'Source ID',
        description: 'Source ID',
        type: 'string',
        required: true
      },
      webhookUrl: {
        label: 'Webhook URL',
        description: 'Webhook URL that will receive all events for the sent message',
        type: 'string',
        format: 'uri',
        required: false
      },
      connectionOverrides: {
        label: 'Connection Overrides',
        description:
          'Connection overrides are configuration supported by twilio webhook services. Must be passed as fragments on the callback url',
        type: 'string',
        required: false,
        default: 'rp=all&rc=5',
        properties: ConnectionOverridesProperties
      }
    },
    testAuthentication: (request) => {
      return request('https://api.twilio.com/2010-04-01')
    }
  },
  // TODO: GROW-259 we'll uncomment this once we remove the calls to the profiles API,
  // but for now this would extend those requests and result in 401s
  // extendRequest: ({ settings }) => {
  //   return {
  //     username: settings.twilioAccountId,
  //     password: settings.twilioAuthToken
  //   }
  // },
  actions: {
    sendSms
  }
}

export default destination
