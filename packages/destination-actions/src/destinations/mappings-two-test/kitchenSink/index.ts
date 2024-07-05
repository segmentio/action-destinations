import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Kitchen Sink',
  description: 'Action with all possible field types',
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
    string_field: {
      label: 'String Field',
      description: 'A test string field',
      type: 'string',
      format: 'email'
    },
    dynamic_string_field: {
      label: 'Dynamic String Field',
      description: 'A test dynamic string field',
      type: 'string',
      dynamic: true,
      multiple: true
    },
    number_field: {
      label: 'Number Field',
      description: 'A test number field',
      type: 'number',
      required: true
    },
    boolean_field: {
      label: 'Boolean Field',
      description: 'A test boolean field',
      type: 'boolean'
    },
    string_select: {
      label: 'Select field',
      description: 'A test select field to pick a single string value',
      type: 'string',
      choices: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ]
    },
    select_number: {
      label: 'Select Number',
      description: 'A test select field to pick a single number value',
      type: 'number',
      choices: [
        { label: 'Number 1', value: 1 },
        { label: 'Number 2', value: 2 }
      ]
    },
    array_field: {
      label: 'Array of string field (Unsupported)',
      description: 'A test array of string field',
      type: 'string',
      multiple: true
    },
    date_time_field: {
      label: 'Date time field',
      description: 'A test date time field',
      type: 'datetime'
    },
    integer_field: {
      label: 'Integer field',
      description: 'A test integer field',
      type: 'integer'
    },
    password_field: {
      label: 'Password field',
      description: 'A test password field',
      type: 'password'
    },
    text_field: {
      label: 'Text field',
      description: 'A Text Field',
      type: 'text'
    },
    unstructured_object: {
      label: 'Unstructured Object',
      description: 'A test unstructured object',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    },
    mappable_object: {
      label: 'Unstructured Object that is only mappable',
      description: 'A test unstructured object',
      type: 'object',
      defaultObjectUI: 'object:only'
    },
    mappable_and_editable_object: {
      label: 'Unstructured Object that is both mappable and editable',
      description: 'A test unstructured object that is both mappable and editable',
      type: 'object'
    },
    structured_object: {
      label: 'Structured Object',
      description: 'A test structured object',
      type: 'object',
      properties: {
        name: {
          label: 'Name',
          description: 'A test string field',
          type: 'string'
        },
        age: {
          label: 'Age',
          description: 'A test number field',
          type: 'number'
        },
        is_active: {
          label: 'Is Active',
          description: 'A test boolean field',
          type: 'boolean'
        },
        role: {
          label: 'Role',
          description: 'A test select field to pick a single string value',
          type: 'string',
          choices: [
            { label: 'Admin', value: 'admin' },
            { label: 'User', value: 'user' }
          ]
        }
      }
    },
    structured_object_with_additional_properties: {
      label: 'Structured Object with Additional Properties',
      description: 'A test structured object with additional properties',
      type: 'object',
      additionalProperties: true,
      properties: {
        name: {
          label: 'Name',
          description: 'A test string field',
          type: 'string'
        },
        age: {
          label: 'Age',
          description: 'A test number field',
          type: 'number'
        }
      }
    },
    structured_array_of_objects: {
      label: 'Structured Array of Objects',
      description: 'A test structured array of objects',
      type: 'object',
      multiple: true,
      properties: {
        name: {
          label: 'Name',
          description: 'A test string field',
          type: 'string'
        },
        age: {
          label: 'Age',
          description: 'A test number field',
          type: 'number'
        }
      }
    },
    structured_array_of_objects_with_additional_props: {
      label: 'Structured Array of Objects with Additional Properties',
      description: 'A test structured array of objects with additional properties',
      type: 'object',
      multiple: true,
      additionalProperties: true,
      properties: {
        name: {
          label: 'Name',
          description: 'A test string field',
          type: 'string'
        },
        age: {
          label: 'Age',
          description: 'A test number field',
          type: 'number'
        }
      }
    }
  },
  dynamicFields: {
    dynamic_string_field: async () => {
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
            description: "A loyal and friendly pet, great for companionship and known as man's best friend."
          },
          {
            label: 'Elephant 🐘',
            value: 'elephant',
            type: 'string',
            description: 'A large and intelligent animal with a trunk, known for its memory and social structure.'
          },
          {
            label: 'Dolphin 🐬',
            value: 'dolphin',
            type: 'string',
            description: 'A highly intelligent and social marine mammal known for its playful behavior and acrobatics.'
          },
          {
            label: 'Tiger 🐅',
            value: 'tiger',
            type: 'string',
            description: 'A majestic and powerful big cat, known for its striking orange coat with black stripes.'
          }
        ],
        nextPage: ''
      })
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
