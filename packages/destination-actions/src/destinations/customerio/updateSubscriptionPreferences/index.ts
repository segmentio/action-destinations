import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import { sendBatch, sendSingle } from '../utils'
import { eventProperties } from '../customerio-properties'

// Reserved Customer.io attributes.
// @see https://docs.customer.io/messaging/channels/subscriptions/set-preferences-outside-center/
const PREFERENCES_ATTRIBUTE = 'cio_subscription_preferences'
const UNSUBSCRIBED_ATTRIBUTE = 'unsubscribed'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Subscription Preferences',
  description:
    "Update a person's subscription preferences in Customer.io: topic and channel preferences used by the subscription center, and the global unsubscribe flag. Only the preferences you send are changed; all others are preserved.",
  defaultSubscription: 'event = "Subscription Preferences Updated"',
  fields: {
    id: {
      label: 'Person ID',
      description:
        'The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description:
        'An optional anonymous ID, used to identify the person when no Person ID or email is provided. [Learn more](https://customer.io/docs/anonymous-events/).',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    email: {
      label: 'Email Address',
      description: "The person's email address, used to identify the person when no Person ID is provided.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    topics: {
      label: 'Topic Preferences',
      description:
        'Subscription preference per topic. Topic IDs come from your Subscription Center settings. Topics that are not included keep their current preference. [Learn more](https://docs.customer.io/messaging/channels/subscriptions/set-preferences-outside-center/).',
      type: 'object',
      multiple: true,
      defaultObjectUI: 'arrayeditor',
      additionalProperties: false,
      properties: {
        topic_id: {
          label: 'Topic ID',
          description:
            'The numeric ID of the topic, shown in the left column of your Subscription Center setup page. Enter the number only (for example `1`), not `topic_1`.',
          type: 'integer',
          required: true
        },
        subscribed: {
          label: 'Subscribed',
          description: '`true` = subscribed, `false` = unsubscribed.',
          type: 'boolean',
          required: true
        }
      }
    },
    channels: {
      label: 'Channel Preferences',
      description: 'Subscription preference per channel. Channels that are not included keep their current preference.',
      type: 'object',
      multiple: true,
      defaultObjectUI: 'arrayeditor',
      additionalProperties: false,
      properties: {
        channel_type: {
          label: 'Channel Type',
          description: 'The channel to update.',
          type: 'string',
          required: true,
          choices: [
            { label: 'Email', value: 'email' },
            { label: 'SMS', value: 'sms' },
            { label: 'Push', value: 'push' },
            { label: 'In-App', value: 'in_app' },
            { label: 'WhatsApp', value: 'whatsapp' },
            { label: 'Slack', value: 'slack' },
            { label: 'LINE', value: 'line' },
            { label: 'Inbox', value: 'inbox' }
          ]
        },
        subscribed: {
          label: 'Subscribed',
          description: '`true` = subscribed, `false` = unsubscribed.',
          type: 'boolean',
          required: true
        }
      }
    },
    unsubscribed: {
      label: 'Globally Unsubscribed',
      description:
        "Sets the person's reserved `unsubscribed` attribute. `true` unsubscribes the person from all messages and clears their topic and channel preferences; `false` resubscribes them but does not restore cleared preferences, so send them again if needed. Leave empty to keep the current value.",
      type: 'boolean',
      default: {
        '@path': '$.properties.unsubscribed'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description:
        'A timestamp of when the preferences were changed. Default is current date and time. Used for ordering updates to the person.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    ...eventProperties
  },

  performBatch: (request, { payload: payloads, settings }) => {
    const options = payloads.map((payload) => ({
      action: 'identify',
      payload: buildRequestPayload(payload),
      settings,
      type: 'person'
    }))

    return sendBatch(request, options)
  },

  perform: (request, { payload, settings }) => {
    const body = buildRequestPayload(payload)

    if (Object.keys(body.attributes).length === 0) {
      throw new PayloadValidationError(
        'At least one of Topic Preferences, Channel Preferences, or Globally Unsubscribed must be provided.'
      )
    }

    return sendSingle(request, { action: 'identify', payload: body, settings, type: 'person' })
  }
}

// Customer.io overwrites every preference when the full `cio_subscription_preferences` object is sent through
// the Track API, but updates only the named preferences when dot-notated keys are used. Emit dot-notated keys so a
// partial update never clobbers preferences that were not part of the event.
function buildRequestPayload(payload: Payload) {
  const { id, topics, channels, unsubscribed, ...rest } = payload
  const attributes: Record<string, boolean> = {}

  for (const { topic_id, subscribed } of topics ?? []) {
    attributes[`${PREFERENCES_ATTRIBUTE}.topics.topic_${topic_id}`] = subscribed
  }

  for (const { channel_type, subscribed } of channels ?? []) {
    attributes[`${PREFERENCES_ATTRIBUTE}.channels.${channel_type}`] = subscribed
  }

  if (unsubscribed !== undefined) {
    attributes[UNSUBSCRIBED_ATTRIBUTE] = unsubscribed
  }

  return {
    ...rest,
    person_id: id,
    attributes
  }
}

export default action
