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
    },
    dynamic_structured_object: {
      label: 'Choose a pet or plant',
      description: 'Choose a pet or plant and provide details',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue',
      properties: {
        pet: {
          label: 'Pet type',
          description: 'Pet type',
          type: 'string',
          dynamic: true
        },
        plant: {
          label: 'Plant type',
          description: 'Plant type',
          type: 'string',
          dynamic: true
        },
        name: {
          label: 'Name',
          description: 'Name',
          type: 'string'
        },
        age: {
          label: 'Age',
          description: 'Age',
          type: 'number',
          choices: [
            { label: '0-10', value: 1 },
            { label: '10-20', value: 2 }
          ]
        }
      }
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
    },
    dynamic_structured_object: {
      pet: async () => {
        return Promise.resolve({
          choices: [
            {
              label: 'Cat 🐱',
              value: 'cat',
              type: 'string',
              description: 'A small, independent, and playful pet known for its agility and affectionate purring.'
            },
            {
              label: 'Dog 🐶',
              value: 'dog',
              type: 'string',
              description: 'A loyal and friendly pet, great for companionship'
            },
            {
              label: 'Fish 🐠',
              value: 'fish',
              type: 'string',
              description: 'A small and low-maintenance pet that lives in water.'
            }
          ],
          nextPage: ''
        })
      },
      plant: async () => {
        return Promise.resolve({
          choices: [
            {
              label: 'Fern 🌿',
              value: 'fern',
              type: 'string',
              description: 'A leafy green plant that thrives in humid environments.'
            },
            {
              label: 'Cactus 🌵',
              value: 'cactus',
              type: 'string',
              description: 'A spiky plant that requires minimal water and sunlight.'
            },
            {
              label: 'Succulent 🌱',
              value: 'succulent',
              type: 'string',
              description: 'A fleshy plant that stores water in its leaves, stems, or roots.'
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
