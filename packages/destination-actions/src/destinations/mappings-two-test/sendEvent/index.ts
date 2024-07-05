import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Test Segment Action',
  platform: 'cloud',
  syncMode: {
    description: 'Define how the records from your destination will be synced to mappings 2 test destination',
    label: 'How to sync records',
    default: 'add',
    choices: [
      { label: 'Adds record to mappings 2 test destination', value: 'add' },
      { label: 'Updates record in mappings 2 test destination', value: 'update' }
    ]
  },
  fields: {
    test_field: {
      label: 'Test Field',
      description: 'A test string field',
      type: 'string'
    },
    dynamic_object: {
      label: 'Dynamic Object',
      description: 'A dynamic object',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      dynamic: true
    }
  },
  dynamicFields: {
    dynamic_object: {
      __keys__: async () => {
        return Promise.resolve({
          choices: [
            {
              label: 'Apple 🍎',
              value: 'apple',
              type: 'string',
              description: 'A crisp and juicy red fruit, perfect for snacking or making pies.'
            },
            {
              label: 'Banana 🍌',
              value: 'banana',
              type: 'string',
              description: 'A sweet and soft yellow fruit, ideal for a quick energy boost.'
            },
            {
              label: 'Cherry 🍒',
              value: 'cherry',
              type: 'string',
              description: 'A small and tart red fruit, great for desserts and snacking.'
            },
            {
              label: 'Grapes 🍇',
              value: 'grapes',
              type: 'string',
              description: 'Juicy and sweet clusters of small, round fruits, perfect for snacking or making wine.'
            },
            {
              label: 'Orange 🍊',
              value: 'orange',
              type: 'string',
              description: 'A tangy and refreshing orange fruit, great for juicing or eating fresh.'
            }
          ],
          nextPage: ''
        })
      },
      __values__: async (_, { dynamicFieldContext }) => {
        const selectedKey = dynamicFieldContext?.selectedKey || 'unknwon'

        return Promise.resolve({
          choices: [
            {
              label: `${selectedKey} juice`,
              value: `${selectedKey}_juice`
            },
            {
              label: `${selectedKey} cake`,
              value: `${selectedKey}_cake`
            },
            {
              label: `${selectedKey} smoothie`,
              value: `${selectedKey}_smoothie`
            }
          ],
          nextPage: ''
        })
      }
    }
  },
  perform: (request, { payload, settings, syncMode }) => {
    const api_key = settings.apiKey
    return request('https://api.segment.io/v1/t', {
      method: 'POST',
      json: {
        userId: 'test-user',
        type: 'track',
        event: 'test-event',
        writeKey: api_key,
        properties: {
          ...payload,
          syncMode
        }
      }
    })
  }
}

export default action
