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
    default: 'update',
    choices: [
      { label: 'Adds record to mappings 2 test destination', value: 'add' },
      { label: 'Updates record in mappings 2 test destination', value: 'update' }
    ]
  },
  fields: {
    test_field: {
      label: 'Test Field',
      description: 'A test string field',
      type: 'string',
      category: 'identifier'
    },
    dynamic_object: {
      label: 'Dynamic Object',
      description: 'A dynamic object',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      dynamic: true,
      category: 'identifier'
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
    },
    dynamic_array: {
      label: 'Dynamic Array',
      description: 'A dynamic array',
      type: 'object',
      defaultObjectUI: 'arrayeditor',
      multiple: true,
      properties: {
        product_category: {
          label: 'Product Category',
          description: 'Product Category',
          type: 'string',
          choices: [
            { label: 'Electronics', value: 'electronics' },
            { label: 'Home Decor', value: 'home-decor' },
            { label: 'Clothing', value: 'clothing' }
          ]
        },
        product_name: {
          label: 'Product Name',
          description: 'Product Name',
          type: 'string',
          dynamic: true
        },
        product_price: {
          label: 'Product Price',
          description: 'Product Price',
          type: 'number'
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
        if (!dynamicFieldContext?.selectedKey) {
          throw new Error('Selected key is missing')
        }
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
    },
    dynamic_array: {
      product_name: async (_, { dynamicFieldContext, payload }) => {
        const products = [
          {
            name: 'Laptop 💻',
            category: 'electronics',
            slug: 'laptop',
            description: 'A high-performance laptop with 16GB RAM and 512GB SSD.'
          },
          {
            name: 'Smartphone 📱',
            category: 'electronics',
            slug: 'smartphone',
            description: 'A sleek smartphone with a powerful camera and long battery life.'
          },
          {
            name: 'Headphones 🎧',
            category: 'electronics',
            slug: 'headphones',
            description: 'Noise-cancelling over-ear headphones with premium sound quality.'
          },
          {
            name: 'Smartwatch ⌚',
            category: 'electronics',
            slug: 'smartwatch',
            description: 'A stylish smartwatch with fitness tracking and notifications.'
          },
          {
            name: 'T-shirt 👕',
            category: 'clothing',
            slug: 't-shirt',
            description: 'A comfortable cotton t-shirt available in various colors.'
          },
          {
            name: 'Jeans 👖',
            category: 'clothing',
            slug: 'jeans',
            description: 'Classic blue jeans with a modern slim fit.'
          },
          {
            name: 'Sneakers 👟',
            category: 'clothing',
            slug: 'sneakers',
            description: 'Stylish and comfortable sneakers for everyday wear.'
          },
          {
            name: 'Jacket 🧥',
            category: 'clothing',
            slug: 'jacket',
            description: 'A warm and trendy jacket perfect for cold weather.'
          },
          {
            name: 'Table Lamp 🛋️',
            category: 'Home Decor',
            slug: 'table-lamp',
            description: 'A modern table lamp with adjustable brightness.'
          },
          {
            name: 'Sofa 🛋️',
            category: 'Home Decor',
            slug: 'sofa',
            description: 'A comfortable sofa with a stylish design and durable fabric.'
          },
          {
            name: 'Wall Art 🖼️',
            category: 'home-decor',
            slug: 'wall-art',
            description: 'Beautiful wall art to add a touch of elegance to your home.'
          },
          {
            name: 'Rug 🏡',
            category: 'home-decor',
            slug: 'rug',
            description: 'A soft and cozy rug perfect for any living space.'
          },
          {
            name: 'Bluetooth Speaker 🔊',
            category: 'Electronics',
            slug: 'bluetooth-speaker',
            description: 'Portable Bluetooth speaker with powerful sound and long battery life.'
          },
          {
            name: 'Dress 👗',
            category: 'Clothing',
            slug: 'dress',
            description: 'A stylish dress perfect for both casual and formal occasions.'
          },
          {
            name: 'Curtains 🏡',
            category: 'home-decor',
            slug: 'curtains',
            description: 'Elegant curtains to enhance the look of any room.'
          },
          {
            name: 'Table 🛋️',
            category: 'home-decor',
            slug: 'table',
            description: 'A modern dining table made of high-quality wood.'
          }
        ]

        const index = dynamicFieldContext?.selectedArrayIndex || 0
        const selectedCategory = payload.dynamic_array?.[index]?.product_category
        const choices = products
          .filter((product) => (selectedCategory ? product.category === selectedCategory : true))
          .map((product) => {
            return { value: product.slug, label: product.name }
          })

        return Promise.resolve({
          choices: choices,
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
