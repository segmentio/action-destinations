import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'

import send from './send'

import sendV2 from './sendV2'

const destination: DestinationDefinition<Settings> = {
  name: 'Amazon Eventbridge',
  slug: 'actions-amazon-eventbridge',
  mode: 'cloud',
  description:
    'Amazon EventBridge is a serverless event bus service that makes it easy to connect your applications with data from a variety of sources.',
  authentication: {
    scheme: 'custom',
    fields: {
      awsAccountId: {
        type: 'string',
        label: 'AWS Account ID',
        description: `The AWS Account ID that the event bus belongs to. 
                      This is used to generate the ARN for the event bus.`,
        required: true
      },
      awsRegion: {
        type: 'string',
        label: 'AWS Region',
        description: 'The AWS region that the event bus belongs to.',
        disabledInputMethods: ['enrichment', 'function', 'variable'],
        required: true,
        choices: [
          { label: 'us-east-1', value: 'us-east-1' },
          { label: 'us-east-2', value: 'us-east-2' },
          { label: 'us-west-1', value: 'us-west-1' },
          { label: 'us-west-2', value: 'us-west-2' },
          { label: 'eu-west-1', value: 'eu-west-1' },
          { label: 'eu-west-2', value: 'eu-west-2' },
          { label: 'eu-west-3', value: 'eu-west-3' },
          { label: 'ap-southeast-1', value: 'ap-southeast-1' },
          { label: 'ap-southeast-2', value: 'ap-southeast-2' },
          { label: 'sa-east-1', value: 'sa-east-1' },
          { label: 'ap-northeast-1', value: 'ap-northeast-1' },
          { label: 'ap-northeast-2', value: 'ap-northeast-2' },
          { label: 'ap-south-1', value: 'ap-south-1' },
          { label: 'ca-central-1', value: 'ca-central-1' },
          { label: 'eu-central-1', value: 'eu-central-1' }
        ]
      },
      partnerEventSourceName: {
        type: 'string',
        label: 'Partner Event Source Name',
        description: 'The name of the partner event source to use for the event bus.',
        required: true,
        default: 'segment.com',
        choices: [
          { label: 'segment.com', value: 'aws.partner/segment.com' },
          { label: 'segment.com.test', value: 'aws.partner/segment.com.test' }
        ]
      },
      createPartnerEventSource: {
        type: 'boolean',
        label: 'Create Partner Event Source',
        description: `If enabled, Segment will check whether Partner Source identified by Segment source ID 
                      exists in EventBridge. 
                      If Partner Source does not exist, Segment will create a new Partner Source.`,
        default: false
      }
    },
    testAuthentication: async (_request, { settings }) => {
      if (!settings.awsAccountId || !settings.awsRegion) {
        throw new Error('AWS Account ID and Region are required.')
      }
    }
  },
  extendRequest() {
    return {
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    }
  },
  actions: {
    send,
    sendV2
  }
}

export default destination
