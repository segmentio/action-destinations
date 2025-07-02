import { ActionDefinition, APIError, ModifiedResponse, PayloadValidationError, HTTPError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { dynamicFields } from './functions/dynamic-field-functions'

const prioritizationChoices = [
  { label: 'Identified', value: 'identified' },
  { label: 'Unidentified', value: 'unidentified' },
  { label: 'Most recently updated', value: 'most_recently_updated' },
  { label: 'Least recently updated', value: 'least_recently_updated' }
]

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Canvas',
  description: 'Trigger a Braze Canvas to deliver a cross-channel message to the specified user.',
  defaultSubscription: 'type = "track"',
  fields: {
    canvas_id: {
      label: 'Canvas ID',
      description:
        'The ID of the canvas to trigger. The canvas must be API-triggered and the status must be "Draft" or "Active".',
      type: 'string',
      required: true,
      dynamic: true
    },

    canvas_entry_properties: {
      label: 'Canvas Entry Properties',
      description:
        'Optional data that will be used to personalize the canvas message. Personalization key-value pairs that will apply to all users in this request.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      default: {
        '@path': '$.properties'
      }
    },
    broadcast: {
      label: 'Broadcast',
      description:
        'If set to true, the canvas will be sent to all the users in the segment targeted by the canvas. It cannot be used with "recipients".',
      type: 'boolean'
    },
    recipients: {
      label: 'Recipients',
      description: 'An array of user identifiers to send the canvas to. It cannot be used with "broadcast".',
      type: 'object',
      multiple: true,
      properties: {
        external_user_id: {
          label: 'External User ID',
          description: 'External identifier of user to receive message.',
          type: 'string',
          default: {
            '@path': '$.userId'
          }
        },
        user_alias: {
          label: 'User Alias',
          description: 'User alias object to identify the user.',
          type: 'object',
          properties: {
            alias_name: {
              label: 'Alias Name',
              type: 'string',
              description: 'The name of the alias',
              default: {
                '@path': '$.traits.braze_alias'
              }
            },
            alias_label: {
              label: 'Alias Label',
              type: 'string',
              description: 'The label of the alias',
              default: {
                '@path': '$.traits.braze_alias_label'
              }
            }
          }
        },

        email: {
          label: 'Email',
          description: 'Email address of user to receive message.',
          type: 'string',
          default: {
            '@path': '$.traits.email'
          }
        },
        canvas_entry_properties: {
          label: 'Canvas Entry Properties',
          description: 'Properties that will override the default canvas_entry_properties for a specific user.',
          type: 'object',
          defaultObjectUI: 'keyvalue'
        },
        send_to_existing_only: {
          label: 'Send to Existing Only',
          description:
            'Defaults to true, cannot be used with user aliases; if set to false, an attributes object must also be included.',
          type: 'boolean'
        },
        attributes: {
          label: 'Attributes',
          description:
            'Fields in the attributes object will create or update an attribute of that name with the given value on the specified user profile before the message is sent and existing values will be overwritten.',
          type: 'object',
          defaultObjectUI: 'keyvalue'
        }
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'broadcast',
            operator: 'is_not',
            value: true
          }
        ]
      },
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'broadcast',
            operator: 'is_not',
            value: true
          }
        ]
      }
    },
    prioritization: {
      label: 'Prioritization',
      description:
        'Prioritization settings; required when using email in recipients. This prioritization will be applied to all recipients.',
      type: 'object',
      properties: {
        first_priority: {
          label: 'First Priority',
          description: 'First priority in the prioritization sequence',
          type: 'string',
          choices: prioritizationChoices
        },
        second_priority: {
          label: 'Second Priority',
          description: 'Second priority in the prioritization sequence',
          type: 'string',
          choices: prioritizationChoices
        }
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'broadcast',
            operator: 'is_not',
            value: true
          }
        ]
      }
    },
    audience: {
      label: 'Audience',
      description:
        'A standard audience object to specify the users to send the canvas to. Including "audience" will only send to users in the audience',
      type: 'object',
      defaultObjectUI: 'keyvalue'
    }
  },
  dynamicFields,
  perform: async (request, { payload, settings }) => {
    // Validate that either broadcast OR recipients is provided (both are required, but mutually exclusive)
    if (!payload.broadcast && (!payload.recipients || payload.recipients.length === 0)) {
      throw new PayloadValidationError('Either "broadcast" must be true or "recipients" list must be provided.')
    }

    // If broadcast is true, recipients list cannot be included
    if (payload.broadcast && payload.recipients && payload.recipients.length > 0) {
      throw new PayloadValidationError('When "broadcast" is true, "recipients" list cannot be included.')
    }

    // Apply the top-level prioritization to each recipient if recipients are provided
    if (payload.recipients?.length && payload.prioritization) {
      // Convert prioritization object to array
      const prioritizationArray: string[] = []

      // Only add prioritization if we have values
      if (payload.prioritization?.first_priority) {
        prioritizationArray.push(payload.prioritization.first_priority)
      }
      if (payload.prioritization?.second_priority) {
        prioritizationArray.push(payload.prioritization.second_priority)
      }
      if (prioritizationArray.length > 0) {
        payload.recipients = payload.recipients.map((recipient) => ({
          ...recipient,
          prioritization: prioritizationArray
        }))
      }

      // Remove the top-level prioritization as it's now applied to each recipient
      delete payload.prioritization
    }

    try {
      return await request(`${settings.endpoint}/canvas/trigger/send`, {
        method: 'POST',
        json: {
          canvas_id: payload.canvas_id,
          canvas_entry_properties: payload.canvas_entry_properties,
          broadcast: payload.broadcast,
          recipients: payload.recipients,
          prioritization: payload.prioritization,
          audience: payload.audience
        }
      })
    } catch (error) {
      // Handle error response format specific to trigger/send endpoint
      if (error instanceof HTTPError && error.response) {
        const responseContent = error.response as ModifiedResponse<{ message?: string }>
        if (responseContent.data?.message) {
          throw new APIError(responseContent.data.message, error.response.status)
        }
      }
      throw error
    }
  }
}

export default action
