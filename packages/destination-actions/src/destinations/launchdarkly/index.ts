import { defaultValues, DestinationDefinition, Preset } from '@segment/actions-core'
import type { Settings } from './generated-types'

import aliasUser from './aliasUser'
import trackEvent from './trackEvent'
import { DEFAULT_EVENTS_HOST_NAME } from './utils'

const presets: Preset[] = [
  {
    name: 'Track Event',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Alias User',
    subscribe: 'type = "identify" or type = "alias"',
    partnerAction: 'aliasUser',
    mapping: defaultValues(aliasUser.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'LaunchDarkly',
  slug: 'actions-launchdarkly',
  mode: 'cloud',
  description:
    'Use Segment events as custom metric events in LaunchDarkly experiments, so you can measure results immediately, without any instrumentation, code, or delays.',

  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'LaunchDarkly client-side ID',
        description: 'Find and copy the client-side ID in the LaunchDarkly account settings page.',
        type: 'string',
        required: true
      },
      events_host_name: {
        label: 'LaunchDarkly events host name',
        description: `Your LaunchDarkly events host name. If not specified, the default value of ${DEFAULT_EVENTS_HOST_NAME} will be used. Most customers will not need to change this setting.`,
        type: 'string',
        default: DEFAULT_EVENTS_HOST_NAME,
        required: false,
        format: 'hostname'
      }
    },
    testAuthentication: (request, { settings }) => {
      // The endpoint we are using to validate the clientID is only compatible with the default host name so we only
      // validate it if the default host name is provided.
      const hostname = settings.events_host_name || DEFAULT_EVENTS_HOST_NAME
      if (hostname !== DEFAULT_EVENTS_HOST_NAME) {
        return true
      }
      // The sdk/goals/{clientID} endpoint returns a 200 if the client ID is valid and a 404 otherwise.
      return request(`https://clientsdk.launchdarkly.com/sdk/goals/${settings.client_id}`, { method: 'head' })
    }
  },

  extendRequest: () => {
    return {
      headers: {
        'User-Agent': 'SegmentDestination/2.2.0',
        'Content-Type': 'application/json',
        'X-LaunchDarkly-Event-Schema': '4'
      }
    }
  },
  presets,
  actions: {
    aliasUser,
    trackEvent
  }
}

export default destination
