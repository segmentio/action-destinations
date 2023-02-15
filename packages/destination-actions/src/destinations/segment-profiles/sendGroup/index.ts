import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, anonymous_id, group_id, traits, engage_space } from '../segment-properties'
import { getEngageSpaces, generateSegmentAPIAuthHeaders } from '../helperFunctions'
import { SEGMENT_ENDPOINTS } from '../properties'
import { MissingUserOrAnonymousIdThrowableError, InvalidEndpointSelectedThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Group',
  description: 'Send a group call to Segment’s tracking API. This is used to associate an individual user with a group',
  defaultSubscription: 'type = "group"',
  fields: {
    engage_space,
    user_id,
    anonymous_id,
    group_id: { ...group_id, required: true },
    traits
  },
  dynamicFields: {
    engage_space: async (request, { settings }) => {
      return getEngageSpaces(request, {
        endpoint: settings.endpoint,
        bearerToken: settings.segment_papi_token
      })
    }
  },
  perform: (request, { payload, settings }) => {
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
    return request(`${selectedSegmentEndpoint}/group`, {
      method: 'POST',
      json: groupPayload,
      headers: {
        authorization: generateSegmentAPIAuthHeaders(payload.engage_space)
      }
    })
  }
}

export default action
