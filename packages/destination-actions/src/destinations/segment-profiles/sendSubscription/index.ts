import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { anonymous_id, engage_space, user_id, traits, subscriptions } from '../segment-properties'
import { InvalidEndpointSelectedThrowableError, MissingUserOrAnonymousIdThrowableError } from '../errors'
import { generateSegmentAPIAuthHeaders } from '../helperFunctions'
import { SEGMENT_ENDPOINTS } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'SendSubscriptions',
  description:
    'Send an identify call to Segment’s tracking API. This is used to tie your users to their actions and record traits about them.',
  defaultSubscription: 'type = "identify"',
  fields: {
    engage_space,
    user_id,
    anonymous_id,
    //group_id,
    traits,
    subscriptions
  },
  perform: (request, { payload, settings }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const subscriptionPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      traits: {
        ...payload?.traits
      },
      context: {
        messaging_subscriptions: payload?.subscriptions
      },
      integrations: {
        // Setting 'integrations.All' to false will ensure that we don't send events
        // to any destinations which is connected to the Segment Profiles space.
        All: false
      }
    }

    //Throw an error if endpoint is not defined or invalid
    if (!settings.endpoint || !(settings.endpoint in SEGMENT_ENDPOINTS)) {
      throw InvalidEndpointSelectedThrowableError
    }

    const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint].url
    console.log('payload', JSON.stringify(subscriptionPayload, null, 2))
    return request(`${selectedSegmentEndpoint}/identify`, {
      method: 'POST',
      json: subscriptionPayload,
      headers: {
        authorization: generateSegmentAPIAuthHeaders(payload.engage_space)
      }
    })

    //papi call
    // return request(`https://api.segmentapis.build/spaces/${payload.engage_space}/messaging-subscriptions`, {
    //   method: 'PUT',
    //   json: subscriptionPayload,
    //   headers: {
    //     authorization: `Bearer $tokensgp`
    //   }
    // })
  }
}

export default action
