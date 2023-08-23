import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { anonymous_id, engage_space, subscriptionProperties, user_id } from '../segment-properties'
import { MissingUserOrAnonymousIdThrowableError } from '../errors'
// import { SEGMENT_ENDPOINTS } from '../properties'
import { generateSegmentAPIAuthHeaders } from '../helperFunctions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Get User Subscriptions into Engage through rETL',
  description: 'Get User Subscriptions into Engage through rETL',
  defaultSubscription: 'type = "identify"',
  fields: {
    engage_space,
    user_id,
    anonymous_id,
    //group_id,
    //traits,
    ...subscriptionProperties
  },
  perform: (request, { payload }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const subscriptionPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      subscriptions: payload?.subscriptions,
      integrations: {
        // Setting 'integrations.All' to false will ensure that we don't send events
        // to any destinations which is connected to the Segment Profiles space.
        All: false
      }
    }

    // Throw an error if endpoint is not defined or invalid
    // if (!settings.endpoint || !(settings.endpoint in SEGMENT_ENDPOINTS)) {
    //   throw InvalidEndpointSelectedThrowableError
    // }

    //const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint].url
    return request(`https://api.segmentapis.build/spaces/${payload.engage_space}/messaging-subscriptions/batch`, {
      method: 'POST',
      json: subscriptionPayload,
      headers: {
        authorization: generateSegmentAPIAuthHeaders(payload.engage_space)
      }
    })
  }
}

export default action
