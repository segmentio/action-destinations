import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { mergeUsers, getPrioritizationChoices, getSupportedIdentifierChoices } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Merge Users [Beta]',
  description:
    'Merge one identified user into another identified user. The merge will occur asynchronously and can take between 5-10 minutes. This Action is in Public Beta.',
  defaultSubscription: 'type = "alias"',
  fields: {
    previousIdType: {
      label: 'Type of Identifier to merge',
      description:
        'The type of identifier for the user to be merged. One of: external_id, user_alias, email, or phone.',
      type: 'string',
      required: true,
      choices: getSupportedIdentifierChoices(),
      default: 'external_id'
    },
    previousIdValue: {
      label: 'ID value to merge',
      description: 'The value of the user identifier to be merged.',
      type: 'string',
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'previousIdType',
            operator: 'is_not',
            value: 'user_alias'
          }
        ]
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'previousIdType',
            operator: 'is_not',
            value: 'user_alias'
          }
        ]
      },
      default: {
        '@path': '$.previousId'
      }
    },
    previousAliasIdValue: {
      label: 'User Alias value to merge',
      description:
        'The value of the user alias identifier to be merged. Required if the previous identifier type is user_alias.',
      type: 'object',
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'previousIdType',
            operator: 'is',
            value: 'user_alias'
          }
        ]
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'previousIdType',
            operator: 'is',
            value: 'user_alias'
          }
        ]
      },
      properties: {
        alias_label: {
          label: 'User Alias Label',
          description: 'The label of the user alias for the user to be merged.',
          type: 'string',
          required: true
        },
        alias_name: {
          label: 'User Alias Name',
          description: 'The name of the user alias for the user to be merged.',
          type: 'string',
          required: true
        }
      }
    },
    keepIdType: {
      label: 'Type of Identifier to keep',
      description: 'The type of the user identifier to be kept. One of: external_id, user_alias, email, or phone.',
      type: 'string',
      required: true,
      choices: getSupportedIdentifierChoices(),
      default: 'external_id'
    },
    keepIdValue: {
      label: 'ID value to keep',
      description: 'The value of the user identifier to be kept.',
      type: 'string',
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'keepIdType',
            operator: 'is_not',
            value: 'user_alias'
          }
        ]
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'keepIdType',
            operator: 'is_not',
            value: 'user_alias'
          }
        ]
      },
      default: { '@path': '$.userId' }
    },
    keepAliasIdValue: {
      label: 'User Alias value to keep',
      description:
        'The value of the user alias identifier for the user to be kept. Required if the keep identifier type is user_alias.',
      type: 'object',
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'keepIdType',
            operator: 'is',
            value: 'user_alias'
          }
        ]
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'keepIdType',
            operator: 'is',
            value: 'user_alias'
          }
        ]
      },
      properties: {
        alias_label: {
          label: 'User Alias Label',
          description: 'The label of the user alias to be kept.',
          type: 'string',
          required: true
        },
        alias_name: {
          label: 'User Alias Name',
          description: 'The name of the user alias to be kept.',
          type: 'string',
          required: true
        }
      }
    },
    keepIdPrioritization: {
      label: 'Rule Prioritization',
      description: 'Rule determining which user to merge if multiple users are found.',
      type: 'string',
      allowNull: true,
      choices: getPrioritizationChoices(),
      required: {
        match: 'any',
        conditions: [
          {
            fieldKey: 'keepIdType',
            operator: 'is',
            value: 'email'
          },
          {
            fieldKey: 'keepIdType',
            operator: 'is',
            value: 'phone'
          }
        ]
      }
    },
    previousIdPrioritization: {
      label: 'Rule Prioritization',
      description: 'Rule determining which user to merge if multiple users are found.',
      type: 'string',
      allowNull: true,
      choices: getPrioritizationChoices(),
      required: {
        match: 'any',
        conditions: [
          {
            fieldKey: 'previousIdType',
            operator: 'is',
            value: 'email'
          },
          {
            fieldKey: 'previousIdType',
            operator: 'is',
            value: 'phone'
          }
        ]
      }
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 50
    }
  },
  perform: (request, { settings, payload }) => {
    return mergeUsers(request, settings, [payload])
  },
  performBatch: (request, { settings, payload }) => {
    return mergeUsers(request, settings, payload)
  }
}

export default action
