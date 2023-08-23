import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, anonymous_id, group_id, traits, engage_space } from '../segment-properties'
import { generateSegmentAPIAuthHeaders } from '../helperFunctions'
import { SEGMENT_ENDPOINTS } from '../properties'
import { MissingUserOrAnonymousIdThrowableError, InvalidEndpointSelectedThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Subscriptions',
  description:
    'Send an identify call to Segment’s tracking API. This is used to tie your users to their actions and record traits about them.',
  defaultSubscription: 'type = "identify"',
  fields: {
    engage_space,
    user_id,
    anonymous_id,
    group_id,
    traits,
    subscriptions: {
      label: 'Subscriptions',
      description: 'Subscription Object contains Global Subscription , Channel , Subscription Groups.',
      type: 'object',
      multiple: true,
      additionalProperties: false,
      required: true,
      properties: {
        key: {
          label: 'ID',
          description: 'A unique identifier for the collection. For example Email, Phone or Push Tokens.',
          type: 'string'
        },
        type: {
          label: 'Channel',
          description: 'A Channel to update subscription EMAIL | SMS | Whatsapp | IosPush | AndroidPush.',
          type: 'string'
        },
        status: {
          label: 'subscriptionStatus',
          description:
            'The subscription status for the Channel true is subscribed, false is unsubscribed and null|undefined is did-not-subscribe.',
          type: 'boolean'
        }
      },
      defaultObjectUI: 'object',
      default: {
        '@arrayPath': [
          '',
          {
            key: '',
            type: '',
            status: ''
          }
        ]
      }
    },
    subscriptionGroups: {
      multiple: true,
      additionalProperties: false,
      label: 'Subscription Groups',
      description: 'Subscription groups and their statuses for this id.',
      type: 'object',
      properties: {
        groupName: {
          label: 'Subscription group name',
          type: 'string'
        },
        isSubscribed: {
          label: 'Group Subscription Status Currently only allowed for EMAIL Channel',
          description:
            'Group subscription status true is subscribed, false is unsubscribed and null is did-not-subscribe',
          // for some reason this still gets deserialized as a string.
          type: 'boolean'
        }
      },
      defaultObjectUI: 'object',
      default: {
        '@arrayPath': [
          '',
          {
            id: '',
            type: '',
            subscriptionStatus: ''
          }
        ]
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }
    const groupPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      groupId: payload?.group_id,
      traits: {
        ...payload?.traits
      },
      integrations: {
        // Setting 'integrations.All' to false will ensure that we don't send events
        // to any destinations which is connected to the Segment Profiles space.
        All: false
      }
    }

    // Throw an error if endpoint is not defined or invalid
    if (!settings.endpoint || !(settings.endpoint in SEGMENT_ENDPOINTS)) {
      throw InvalidEndpointSelectedThrowableError
    }

    const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint].url
    const profileResponse = await request(`${selectedSegmentEndpoint}/identify`, {
      method: 'POST',
      json: groupPayload,
      headers: {
        authorization: generateSegmentAPIAuthHeaders(payload.engage_space)
      }
    })

    if (profileResponse.ok) {
      const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint].papi
      const pssResponse = await request(
        `${selectedSegmentEndpoint}/spaces/${payload?.engage_space}/messaging-subscriptions/batch`,
        {
          method: 'POST',
          json: payload?.subscriptions,
          headers: {
            authorization: generateSegmentAPIAuthHeaders(payload.engage_space)
          }
        }
      )
      console.log(pssResponse)
    }

    return profileResponse
  }
}

export default action
