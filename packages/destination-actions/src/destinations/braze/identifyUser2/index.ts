import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const prioritizationChoices = [
  { value: 'unidentified', label: 'Unidentified' },
  { value: 'most_recently_updated', label: 'Most Recently Updated' },
  { value: 'least_recently_updated', label: 'Least Recently Updated' }
]

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User V2',
  description:
    'Identifies an unidentified (alias-only) user. Use alongside the Create Alias action, or with user aliases you have already defined.',
  fields: {
    external_id: {
      label: 'External ID',
      description: 'The external ID of the user to identify.',
      type: 'string',
      required: true
    },
    user_alias: {
      label: 'User Alias Object',
      description:
        'A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).',
      type: 'object',
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'email_to_identify',
            operator: 'is',
            value: undefined
          }
        ]
      },
      properties: {
        alias_name: {
          label: 'Alias Name',
          type: 'string',
          required: true
        },
        alias_label: {
          label: 'Alias Label',
          type: 'string',
          required: true
        }
      }
    },
    email_to_identify: {
      label: 'Email to Identify',
      description: 'Email address to identify user.',
      type: 'string',
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'user_alias',
            operator: 'is',
            value: undefined
          }
        ]
      }
    },
    prioritization: {
      label: 'Prioritization',
      description:
        'Prioritization settings for user merging if multiple users are found. Required when email_to_identify is provided.',
      type: 'object',
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'email_to_identify',
            operator: 'is_not',
            value: undefined
          }
        ]
      },
      properties: {
        first_priority: {
          label: 'First Priority',
          description: 'First priority for user merging if multiple users are found',
          type: 'string',
          required: true,
          choices: prioritizationChoices
        },
        second_priority: {
          label: 'Second Priority',
          description: 'Second priority for user merging if multiple users are found',
          type: 'string',
          choices: prioritizationChoices
        }
      }
    },
    merge_behavior: {
      label: 'Merge Behavior',
      description:
        'Sets the endpoint to merge some fields found exclusively on the anonymous user to the identified user. See [the docs](https://www.braze.com/docs/api/endpoints/user_data/post_user_identify/#request-parameters).',
      type: 'string',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'merge', label: 'Merge' }
      ]
    }
  },
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to identify Users',
    default: 'add',
    choices: [
      { label: 'Insert User', value: 'add' },
      { label: 'Upsert User', value: 'upsert' }
    ]
  },
  perform: (request, { settings, payload, syncMode }) => {
    if (syncMode === 'add' || syncMode === 'upsert') {
      const requestBody: Record<string, any> = {
        ...(payload.merge_behavior !== undefined && { merge_behavior: payload.merge_behavior })
      }

      // Add aliases_to_identify if user_alias is provided
      if (payload.user_alias) {
        requestBody.aliases_to_identify = [
          {
            external_id: payload.external_id,
            user_alias: payload.user_alias
          }
        ]
      }

      if (payload.email_to_identify) {
        // Create prioritization array with at least one element (first_priority is required)
        const prioritization = [payload.prioritization!.first_priority]

        // Add second_priority to the array if it exists
        if (payload.prioritization!.second_priority) {
          prioritization.push(payload.prioritization!.second_priority)
        }

        requestBody.emails_to_identify = [
          {
            external_id: payload.external_id,
            email: payload.email_to_identify,
            prioritization
          }
        ]
      }

      return request(`${settings.endpoint}/users/identify`, {
        method: 'post',
        json: requestBody
      })
    }

    throw new IntegrationError('syncMode must be "add" or "upsert"', 'Invalid syncMode', 400)
  }
}

export default action
