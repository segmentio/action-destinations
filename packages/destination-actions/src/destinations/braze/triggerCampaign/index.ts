import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError, HTTPError, ModifiedResponse } from '@segment/actions-core'
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
  title: 'Trigger Campaign',
  description: 'Trigger a Braze Campaign via API-triggered delivery',
  defaultSubscription: 'type = "track"',
  dynamicFields: {
    ...dynamicFields
  },
  fields: {
    campaign_id: {
      label: 'Campaign ID',
      description:
        'The ID of the Braze campaign to trigger. The campaign must be an API-triggered campaign created in Braze.',
      type: 'string',
      required: true,
      dynamic: true
    },
    send_id: {
      label: 'Send ID',
      description:
        'Optional string to identify the send. This can be used for send level analytics, or to cancel a send.',
      type: 'string'
    },
    trigger_properties: {
      label: 'Trigger Properties',
      description:
        'Optional data that will be used to personalize the campaign message. Personalization key-value pairs that will apply to all users in this request.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    broadcast: {
      label: 'Broadcast',
      description:
        'If set to true, and if the audience is not provided, the campaign will be sent to all the users in the segment targeted by the campaign. It can not be used with "recipients".',
      type: 'boolean',
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'recipients',
            operator: 'is',
            value: undefined
          },
          {
            fieldKey: 'audience',
            operator: 'is',
            value: undefined
          }
        ]
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'recipients',
            operator: 'is',
            value: undefined
          }
        ]
      }
    },
    attachments: {
      label: 'Attachments',
      description: 'Attachments to send along with the campaign. Limited to 2MB per file.',
      type: 'object',
      multiple: true,
      properties: {
        file_name: {
          label: 'File Name',
          description: 'The name of the file to be attached.',
          type: 'string',
          required: true
        },
        url: {
          label: 'URL',
          description: 'The URL of the file to be attached.',
          type: 'string',
          required: true
        }
      },
      defaultObjectUI: 'arrayeditor'
    },
    recipients: {
      label: 'Recipients',
      description: 'An array of user identifiers to send the campaign to. It can not be used with "broadcast".',
      type: 'object',
      multiple: true,
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
          type: 'object'
        },
        email: {
          label: 'Email',
          description: 'Email address of user to receive message.',
          type: 'string',
          default: {
            '@path': '$.traits.email'
          }
        },
        trigger_properties: {
          label: 'User Trigger Properties',
          description: 'Properties that will override the default trigger_properties for a specific user.',
          type: 'object'
        },
        send_to_existing_only: {
          label: 'Send to Existing Only',
          description:
            "Defaults to true, can't be used with user aliases; if set to false, an attributes object must also be included.",
          type: 'boolean'
        },
        attributes: {
          label: 'User Attributes',
          description:
            'Fields in the attributes object will create or update an attribute of that name with the given value on the specified user profile before the message is sent and existing values will be overwritten.',
          type: 'object'
        }
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
      }
    },
    audience: {
      label: 'Audience',
      description:
        'A standard audience object to specify the users to send the campaign to. Including "audience" will only send to users in the audience',
      type: 'object',
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'recipients',
            operator: 'is',
            value: undefined
          },
          {
            fieldKey: 'broadcast',
            operator: 'is',
            value: true
          }
        ]
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    // Validate that either broadcast OR recipients is provided (both are required, but mutually exclusive)
    if (!payload.broadcast && (!payload.recipients || payload.recipients.length === 0)) {
      throw new IntegrationError(
        'Either "broadcast" must be true or "recipients" list must be provided.',
        'Missing required fields',
        400
      )
    }

    // If broadcast is true, recipients list cannot be included
    if (payload.broadcast && payload.recipients && payload.recipients.length > 0) {
      throw new IntegrationError(
        'When "broadcast" is true, "recipients" list cannot be included.',
        'Invalid targeting parameters',
        400
      )
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
      return await request(`${settings.endpoint}/campaigns/trigger/send`, {
        method: 'post',
        json: payload
      })
    } catch (error) {
      // Handle error response format specific to trigger/send endpoint
      if (error instanceof HTTPError && error.response) {
        const responseContent = error.response as ModifiedResponse<{ message?: string }>
        if (responseContent.data?.message) {
          throw new IntegrationError(responseContent.data.message, 'BRAZE_API_ERROR', error.response.status)
        }
      }
      throw error
    }
  }
}

export default action
