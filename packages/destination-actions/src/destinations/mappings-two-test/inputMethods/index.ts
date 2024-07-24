import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Input Methods Testing',
  description: 'This action tests all possible input methods.',
  platform: 'cloud',
  syncMode: {
    description: 'Define how the records from your destination will be synced to mappings 2 test destination',
    label: 'How to sync records',
    default: 'upsert',
    choices: [{ label: 'Upsert record to mappings 2 test destination', value: 'upsert' }]
  },
  fields: {
    string_field_no_free_form: {
      label: 'String Field (no free form)',
      description: 'A test string field',
      type: 'string',
      format: 'email',
      disabledInputMethods: ['freeform']
    },
    string_field_no_picker: {
      label: 'String Field (no picker)',
      description: 'A test string field',
      type: 'string',
      format: 'email',
      disabledInputMethods: ['enrichment', 'function', 'variable', 'literal']
    },
    dynamic_string_field: {
      label: 'Dynamic String Field (only available options)',
      description: 'A test dynamic string field',
      type: 'string',
      dynamic: true,
      disabledInputMethods: ['freeform', 'variable', 'enrichment', 'function']
    },
    number_field: {
      label: 'Number Field (no freeform)',
      description: 'A test number field',
      type: 'number',
      required: true,
      disabledInputMethods: ['freeform']
    },
    boolean_field: {
      label: 'Boolean Field (only literal)',
      description: 'A test boolean field',
      type: 'boolean',
      disabledInputMethods: ['freeform', 'variable', 'enrichment', 'function']
    },
    string_select: {
      label: 'Select field (only literal)',
      description: 'A test select field to pick a single string value',
      type: 'string',
      choices: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ],
      disabledInputMethods: ['freeform', 'variable', 'enrichment', 'function']
    },
    unstructured_object: {
      label: 'Unstructured Object (no freeform)',
      description: 'A test unstructured object',
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      disabledInputMethods: ['freeform']
    },
    mappable_and_editable_object: {
      label: 'Unstructured Object (only freeform)',
      description: 'A test unstructured object that is both mappable and editable',
      type: 'object',
      disabledInputMethods: ['variable', 'enrichment', 'function', 'literal']
    },
    structured_object: {
      label: 'Structured Object (only freeform)',
      description: 'A test structured object',
      type: 'object',
      disabledInputMethods: ['variable', 'enrichment', 'function', 'literal'],
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
      label: 'Structured Object with Additional Properties (no freeform)',
      description: 'A test structured object with additional properties',
      type: 'object',
      additionalProperties: true,
      disabledInputMethods: ['freeform'],
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
      label: 'Structured Array of Objects (no freeform)',
      description: 'A test structured array of objects',
      type: 'object',
      multiple: true,
      defaultObjectUI: 'arrayeditor',
      disabledInputMethods: ['freeform'],
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
