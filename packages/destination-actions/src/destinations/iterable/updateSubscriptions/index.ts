import { ActionDefinition, PayloadValidationError, MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MAX_SUBSCRIPTION_ITEMS } from './constants'
import { resolveIdentifier, getSubscriptionEndpoint, getSingleUserEndpoint } from './functions'
import { fetchChannels, fetchMessageTypes, fetchLists } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Subscriptions',
  description: 'Manage subscription preferences for a user, including subscribing and unsubscribing from channels, message types, and email lists.',
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
        const index = dynamicFieldContext?.selectedArrayIndex ?? 0
        const groupType = payload?.subscriptions?.[index]?.subscription_group_type

        if (!groupType) {
          return {
            choices: [],
            error: {
              code: 'MISSING_GROUP_TYPE',
              message: "Select a 'Subscription Group Type' first."
            }
          }
        }

        switch (groupType) {
          case 'messageChannel':
            return fetchChannels(request, settings)
          case 'messageType':
            return fetchMessageTypes(request, settings)
          case 'emailList':
            return fetchLists(request, settings)
          default:
            return {
              choices: [],
              error: {
                code: 'INVALID_GROUP_TYPE',
                message: `Unknown subscription group type: ${groupType}`
              }
            }
        }
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    if (payload.subscriptions.length > MAX_SUBSCRIPTION_ITEMS) {
      throw new PayloadValidationError(`Maximum of ${MAX_SUBSCRIPTION_ITEMS} subscription items allowed. Received ${payload.subscriptions.length}.`)
    }

    const identifier = resolveIdentifier(payload)

    const results = await Promise.all(
      payload.subscriptions.map(async (sub) => {
        const endpoint = getSingleUserEndpoint(settings, sub.subscription_group_type, sub.subscription_group_id, identifier)
        const method = sub.action === 'subscribe' ? 'patch' : 'delete'
        return request(endpoint, { method })
      })
    )

    return results[results.length - 1]
  },

  performBatch: async (request, { settings, payload: payloads }) => {
    const multiStatusResponse = new MultiStatusResponse()
    const validPayloads: { index: number; identifier: { email?: string; userId?: string } }[] = []

    payloads.forEach((payload, index) => {
      if (payload.subscriptions.length > MAX_SUBSCRIPTION_ITEMS) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: `Maximum of ${MAX_SUBSCRIPTION_ITEMS} subscription items allowed. Received ${payload.subscriptions.length}.`
        })
        return
      }

      try {
        const identifier = resolveIdentifier(payload)
        validPayloads.push({ index, identifier })
      } catch (error) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: (error as Error).message
        })
      }
    })

    if (validPayloads.length === 0) {
      return multiStatusResponse
    }

    const subscriptions = payloads[0].subscriptions

    const users = validPayloads.filter((p) => p.identifier.email).map((p) => p.identifier.email!)
    const usersByUserId = validPayloads.filter((p) => p.identifier.userId && !p.identifier.email).map((p) => p.identifier.userId!)

    const body: Record<string, string[]> = {}
    if (users.length > 0) body.users = users
    if (usersByUserId.length > 0) body.usersByUserId = usersByUserId

    try {
      await Promise.all(
        subscriptions.map(async (sub) => {
          const endpoint = getSubscriptionEndpoint(settings, sub.subscription_group_type, sub.subscription_group_id, sub.action)
          return request(endpoint, {
            method: 'put',
            json: body
          })
        })
      )

      validPayloads.forEach(({ index }) => {
        multiStatusResponse.setSuccessResponseAtIndex(index, {
          status: 200,
          sent: payloads[index],
          body: 'success'
        })
      })
    } catch (error) {
      validPayloads.forEach(({ index }) => {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: (error as any).status || 500,
          errortype: 'API_ERROR',
          errormessage: (error as Error).message
        })
      })
    }

    return multiStatusResponse
  }
}

export default action
