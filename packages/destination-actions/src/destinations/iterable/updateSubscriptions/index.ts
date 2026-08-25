import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { performUpdateSubscriptions, performBatchUpdateSubscriptions } from './functions'
import { getSubscriptionGroupId } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Subscriptions [Beta]',
  description:
    'This feature is in beta. Manage subscription preferences for a user, including subscribing and unsubscribing from channels, message types, and email lists. This integration is only supported on Iterable projects with opt-in Message Type Subscriptions and the Subscriptions API enabled.',
  defaultSubscription: 'type = "track" and event = "Subscriptions Updated"',
  fields: {
    identifier: {
      label: 'User Identifier',
      description: 'User identifier - provide email, userId, or both. At least one is required.',
      type: 'object',
      required: true,
      additionalProperties: false,
      properties: {
        email: {
          label: 'Email',
          description: 'An email address that identifies a user profile in Iterable.',
          type: 'string',
          format: 'email',
          required: false
        },
        userId: {
          label: 'User ID',
          description: 'A user ID that identifies a user profile in Iterable.',
          type: 'string',
          required: false
        }
      },
      default: {
        email: { '@path': '$.properties.email' },
        userId: { '@path': '$.userId' }
      }
    },
    user_identifier_preference: {
      label: 'User Identifier Preference',
      description:
        'When both email and userId are provided, this determines which identifier is sent to Iterable. Iterable requires one or the other, not both.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Email', value: 'email' },
        { label: 'User ID', value: 'userId' }
      ],
      default: 'email',
      disabledInputMethods: ['variable', 'function', 'freeform', 'enrichment']
    },
    subscriptions: {
      label: 'Subscription Preferences',
      description: 'Subscription changes to apply for this user. Maximum 6 items.',
      type: 'object',
      multiple: true,
      required: true,
      defaultObjectUI: 'arrayeditor',
      additionalProperties: false,
      properties: {
        subscription_group_type: {
          label: 'Subscription Group Type',
          description: 'The type of subscription group.',
          type: 'string',
          required: true,
          choices: [
            { label: 'Email List', value: 'emailList' },
            { label: 'Message Type', value: 'messageType' },
            { label: 'Message Channel', value: 'messageChannel' }
          ],
          disabledInputMethods: ['variable', 'function', 'freeform', 'enrichment']
        },
        subscription_group_id: {
          label: 'Subscription Group ID',
          description: 'The ID of the subscription group. Select a group type first to see available options.',
          type: 'string',
          required: true,
          dynamic: true,
          disabledInputMethods: ['variable', 'function', 'freeform', 'enrichment']
        },
        action: {
          label: 'Action',
          description: 'Whether to subscribe or unsubscribe the user from this group.',
          type: 'string',
          required: true,
          choices: [
            { label: 'Subscribe', value: 'subscribe' },
            { label: 'Unsubscribe', value: 'unsubscribe' }
          ]
        }
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'When enabled, Segment will send data to Iterable in batches.',
      type: 'boolean',
      required: false,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 1000
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching events together.',
      type: 'string',
      multiple: true,
      unsafe_hidden: true,
      required: false,
      default: ['subscriptions', 'user_identifier_preference']
    }
  },
  dynamicFields: {
    subscriptions: {
      subscription_group_id: async (request, { payload, dynamicFieldContext, settings }) => {
        return getSubscriptionGroupId(request, { payload, dynamicFieldContext, settings })
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    return performUpdateSubscriptions(request, payload, settings)
  },
  performBatch: async (request, { settings, payload: payloads }) => {
    return performBatchUpdateSubscriptions(request, payloads, settings)
  }
}

export default action
