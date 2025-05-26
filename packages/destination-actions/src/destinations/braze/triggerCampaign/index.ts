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
      description: 'Must be set to true when sending a message to an entire segment that a campaign targets.',
      type: 'boolean',
      default: false
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
      description: 'An array of user identifiers to send the campaign to.',
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
        prioritization: {
          label: 'Prioritization',
          description: 'Prioritization array; required when using email.',
          type: 'string',
          multiple: true
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
    audience: {
      label: 'Audience',
      description: 'A standard audience object to specify the users to send the campaign to.',
      type: 'object'
    },
    segment_id: {
      label: 'Segment ID',
      description: 'The ID of the segment to send the campaign to.',
      type: 'string'
    }
  },
  hooks: {
    onMappingSave: {
      label: 'Validate Braze Campaign',
      description: 'When saving this mapping, we will validate that the campaign exists and can be triggered via API.',
      inputFields: {
        campaign_id: {
          type: 'string',
          label: 'Campaign ID',
          description: 'The ID of the Braze campaign to validate.',
          required: true
        }
      },
      outputTypes: {
        id: {
          type: 'string',
          label: 'Campaign ID',
          description: 'The ID of the validated Braze campaign.',
          required: false
        },
        name: {
          type: 'string',
          label: 'Campaign Name',
          description: 'The name of the validated Braze campaign.',
          required: false
        }
      },
      performHook: async (request, { settings, hookInputs }) => {
        // Check if campaign exists and is API-triggered
        try {
          // Make request to Braze API to get campaign details
          const response = await request(`${settings.endpoint}/campaigns/details`, {
            method: 'GET',
            searchParams: new URLSearchParams({
              campaign_id: hookInputs.campaign_id
            })
          })

          if (!response.ok || !response.data) {
            return {
              error: {
                message: `Failed to fetch campaign details for ID '${hookInputs.campaign_id}'`,
                code: 'CAMPAIGN_FETCH_ERROR'
              }
            }
          }

          const data = response.data as { name: string; schedule_type: string }

          // Check if campaign is API-triggered
          if (data.schedule_type !== 'api_triggered') {
            return {
              error: {
                message: `Campaign '${data.name}' (${hookInputs.campaign_id}) is not configured for API triggering. Please update the campaign in Braze to enable API triggering.`,
                code: 'CAMPAIGN_NOT_API_TRIGGERED'
              }
            }
          }

          // Campaign exists and is API-triggered
          return {
            successMessage: `Campaign '${data.name}' (${hookInputs.campaign_id}) is valid and can be triggered via API.`,
            savedData: {
              id: hookInputs.campaign_id,
              name: data.name
            }
          }
        } catch (error: any) {
          return {
            error: {
              message: error.message || `Failed to validate campaign with ID '${hookInputs.campaign_id}'`,
              code: error.status || 'CAMPAIGN_VALIDATION_ERROR'
            }
          }
        }
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    // Validate that at least one of the required targeting parameters is provided
    if (
      !payload.broadcast &&
      !payload.recipients?.length &&
      !payload.segment_id &&
      // !payload.audience_id &&
      !payload.audience
    ) {
      throw new IntegrationError(
        'One of "recipients", "segment_id", "audience_id", "audience", or "broadcast" must be provided.',
        'Missing required fields',
        400
      )
    }

    // Prepare the request body with only defined fields
    const requestBody: Record<string, unknown> = {
      campaign_id: payload.campaign_id
    }

    if (payload.send_id) {
      requestBody.send_id = payload.send_id
    }

    if (payload.trigger_properties) {
      requestBody.trigger_properties = payload.trigger_properties
    }

    if (payload.broadcast !== undefined) {
      requestBody.broadcast = payload.broadcast
    }

    if (payload.recipients?.length) {
      // Extract only the fields that are actually defined for each recipient
      const recipients = payload.recipients.map((recipient) => {
        const result: Record<string, unknown> = {}

        if (recipient.external_user_id) {
          result.external_user_id = recipient.external_user_id
        }

        if (recipient.user_alias?.alias_name && recipient.user_alias?.alias_label) {
          result.user_alias = {
            alias_name: recipient.user_alias.alias_name,
            alias_label: recipient.user_alias.alias_label
          }
        }

        if (recipient.email) {
          result.email = recipient.email
        }

        if (recipient.prioritization && recipient.prioritization.length > 0) {
          result.prioritization = recipient.prioritization
        }

        if (recipient.trigger_properties) {
          result.trigger_properties = recipient.trigger_properties
        }

        if (recipient.send_to_existing_only !== undefined) {
          result.send_to_existing_only = recipient.send_to_existing_only
        }

        if (recipient.attributes) {
          result.attributes = recipient.attributes
        }

        // if (recipient.custom_events?.length) {
        //   result.custom_events = recipient.custom_events
        // }

        // if (recipient.purchases?.length) {
        //   result.purchases = recipient.purchases
        // }

        return result
      })

      // Only include recipients that have at least one identifier
      const validRecipients = recipients.filter((r) => Object.keys(r).length > 0)

      if (validRecipients.length > 0) {
        requestBody.recipients = validRecipients
      }
    }

    if (payload.segment_id) {
      requestBody.segment_id = payload.segment_id
    }

    // if (payload.audience_id) {
    //   requestBody.audience_id = payload.audience_id
    // }

    if (payload.audience) {
      requestBody.audience = payload.audience
    }

    if (payload.attachments?.length) {
      requestBody.attachments = payload.attachments
    }

    return request(`${settings.endpoint}/campaigns/trigger/send`, {
      method: 'post',
      json: requestBody
    })
  }
}

export default action
