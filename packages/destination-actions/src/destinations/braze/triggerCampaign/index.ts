import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { dynamicFields } from './functions/dynamic-field-functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Campaign',
  description: 'Trigger a Braze Campaign via API-triggered delivery',
  defaultSubscription: 'type = "track"',
  dynamicFields,
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
        'Must be set to true when sending a message to an entire segment that a campaign targets. Only one of "broadcast", "recipients" or "audience" should be provided.',
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
          },
          {
            fieldKey: 'audience',
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
      }
    },
    recipients: {
      label: 'Recipients',
      description:
        'An array of user identifiers to send the campaign to. Only one of "recipients", "broadcast" or "audience" should be provided.',
      type: 'object',
      multiple: true,
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'broadcast',
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
            fieldKey: 'broadcast',
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
        'Prioritization array; required when using email. This prioritization will be applied to all recipients.',
      type: 'string',
      multiple: true,
      defaultObjectUI: 'arrayeditor',
      choices: [
        { label: 'Identified', value: 'identified' },
        { label: 'Unidentified', value: 'unidentified' },
        { label: 'Most recently updated', value: 'most_recently_updated' },
        { label: 'Least recently updated', value: 'least_recently_updated' }
      ]
    },
    audience: {
      label: 'Audience',
      description:
        'A standard audience object to specify the users to send the campaign to. Only one of "recipients", "broadcast" or "audience" should be provided.',
      type: 'object',
      required: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'broadcast',
            operator: 'is',
            value: undefined
          },
          {
            fieldKey: 'recipients',
            operator: 'is',
            value: undefined
          }
        ]
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'broadcast',
            operator: 'is',
            value: undefined
          },
          {
            fieldKey: 'recipients',
            operator: 'is',
            value: undefined
          }
        ]
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    // Count how many targeting parameters are provided
    let targetingParamsCount = 0
    if (payload.broadcast) targetingParamsCount++
    if (payload.recipients?.length) targetingParamsCount++
    if (payload.audience) targetingParamsCount++

    // Validate that exactly one of the required targeting parameters is provided
    if (targetingParamsCount === 0) {
      throw new IntegrationError(
        'One of "recipients", "broadcast" or "audience", must be provided.',
        'Missing required fields',
        400
      )
    }

    if (targetingParamsCount > 1) {
      throw new IntegrationError(
        'Only one of "recipients", "broadcast" or "audience" should be provided.',
        'Multiple targeting parameters provided',
        400
      )
    }

    // Apply the top-level prioritization to each recipient if recipients are provided
    if (payload.recipients?.length && payload.prioritization) {
      payload.recipients = payload.recipients.map((recipient) => ({
        ...recipient,
        prioritization: payload.prioritization
      }))

      // Remove the top-level prioritization as it's now applied to each recipient
      delete payload.prioritization
    }

    return request(`${settings.endpoint}/campaigns/trigger/send`, {
      method: 'post',
      json: payload
    })
  }
}

export default action
