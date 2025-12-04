import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send any Segment event to Zapier',
  fields: {
    data: {
      label: 'Payload',
      description: 'The payload to send to Zapier',
      type: 'object',
      required: true,
      default: {
        '@path': '$'
      }
    },
    zapSubscriptionUrl: {
      label: 'Zapier Webhook URL',
      description: 'The Zapier webhook URL to send the data to',
      type: 'string',
      format: 'password',
      readOnly: false,
      required: true
    },
    zapIdentifier: {
      label: 'Zapier Zap Identifier',
      description: 'An identifier for the Zapier Zap (for your reference)',
      type: 'string',
      readOnly: false,
      required: false
    },
    fql: {
      label: 'FQL Query',
      description: 'An FQL query configured by Zapier when the Zap was created',
      type: 'string',
      readOnly: false,
      required: false
    }
  },
  perform: (request, { settings, payload }) => {
    const { zapSubscriptionUrl, data} = payload
    
    return request(zapSubscriptionUrl, {
      method: 'post',
      json: data
    })
  }
}

export default action
