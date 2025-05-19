import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Campaign',
  description: 'Trigger a Braze Campaign via API-triggered delivery',
  defaultSubscription: 'type = "track"',
  fields: {
    campaign_id: {
      label: 'Campaign ID',
      description:
        'The ID of the Braze campaign to trigger. The campaign must be an API-triggered campaign created in Braze.',
      type: 'string',
      required: true
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
    recipients: {
      label: 'Recipients',
      description: 'An array of user identifiers to send the campaign to.',
      type: 'object',
      multiple: true,
      properties: {
        external_user_id: {
          label: 'External User ID',
          description: 'The external ID of the user to send the campaign to.',
          type: 'string',
          default: {
            '@path': '$.userId'
          }
        },
        user_alias: {
          label: 'User Alias',
          description: 'A user alias object to identify the user.',
          type: 'object',
          properties: {
            alias_name: {
              label: 'Alias Name',
              type: 'string'
            },
            alias_label: {
              label: 'Alias Label',
              type: 'string'
            }
          }
        },
        braze_id: {
          label: 'Braze ID',
          description: 'The Braze user identifier.',
          type: 'string',
          allowNull: true,
          default: {
            '@path': '$.properties.braze_id'
          }
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
    },
    audience_id: {
      label: 'Connected Audience ID',
      description: 'The ID of the Connected Audience to send the campaign to.',
      type: 'string'
    }
  },

  perform: async (request, { settings, payload }) => {
    // Validate that at least one of the required targeting parameters is provided
    if (
      !payload.broadcast &&
      !payload.recipients?.length &&
      !payload.segment_id &&
      !payload.audience_id &&
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

        if (recipient.braze_id) {
          result.braze_id = recipient.braze_id
        }

        if (recipient.user_alias?.alias_name && recipient.user_alias?.alias_label) {
          result.user_alias = {
            alias_name: recipient.user_alias.alias_name,
            alias_label: recipient.user_alias.alias_label
          }
        }

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

    if (payload.audience_id) {
      requestBody.audience_id = payload.audience_id
    }

    if (payload.audience) {
      requestBody.audience = payload.audience
    }

    return request(`${settings.endpoint}/campaigns/trigger/send`, {
      method: 'post',
      json: requestBody
    })
  }
}

export default action
