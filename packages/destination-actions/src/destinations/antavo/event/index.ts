import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ANTAVO_API_VERSION } from '../versioning-info'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Loyalty events',
  description: 'Sync loyalty events into Antavo',
  defaultSubscription: 'type = "track"',
  fields: {
    customer: {
      label: 'Customer ID',
      description: 'User ID, selected in Antavo as customer identifier',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    action: {
      label: 'Action',
      description: 'Loyalty event name in Antavo',
      type: 'string',
      required: true
    },
    account: {
      label: 'Account',
      description: 'Antavo Account ID — if the Multi Accounts extension is enabled',
      type: 'string',
      required: false
    },
    data: {
      label: 'Event data',
      description: 'Event data',
      type: 'object',
      required: false
    }
  },
  perform: (request, data) => {
    const url = `https://api.${data.settings.stack}.antavo.com/${ANTAVO_API_VERSION}/webhook/segment`
    const payload = {
      ...data.payload,
      api_key: data.settings.api_key
    }

    return request(url, {
      method: 'post',
      json: payload
    })
  }
}

export default action
