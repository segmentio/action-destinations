import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyUser from './identifyUser'
import logEvent from './logEvent'
import mapUser from './mapUser'
import groupIdentifyUser from './groupIdentifyUser'
import orderCompleted from './orderCompleted'

/** used in the quick setup */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track" and event != "Order Completed"',
    partnerAction: 'logEvent',
    mapping: defaultValues(logEvent.fields)
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'logEvent',
    mapping: {
      ...defaultValues(logEvent.fields),
      event_type: {
        '@template': 'Viewed {{name}}'
      }
    }
  },
  {
    name: 'Screen Calls',
    subscribe: 'type = "screen"',
    partnerAction: 'logEvent',
    mapping: {
      ...defaultValues(logEvent.fields),
      event_type: {
        '@template': 'Viewed {{name}}'
      }
    }
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyUser',
    mapping: defaultValues(identifyUser.fields)
  },
  {
    name: 'Track Purchases',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'orderCompleted',
    mapping: defaultValues(orderCompleted.fields)
  },
  {
    name: 'Browser Session Tracking',
    subscribe: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
    partnerAction: 'sessionId',
    mapping: {}
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Actions Amplitude',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Amplitude project API key. You can find this key in the "General" tab of your Amplitude project.',
        type: 'string',
        required: true
      },
      secretKey: {
        label: 'Secret Key',
        description:
          'Amplitude project secret key. You can find this key in the "General" tab of your Amplitude project.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Note: Amplitude has some apis that use basic auth (like this one)
      // and others that use custom auth in the request body
      return request('https://amplitude.com/api/2/usersearch?user=testUser@example.com', {
        username: settings.apiKey,
        password: settings.secretKey
      })
    }
  },
  onDelete: async (request, { settings, payload }) => {
    return request('https://amplitude.com/api/2/deletions/users', {
      username: settings.apiKey,
      password: settings.secretKey,
      method: 'post',
      json: {
        user_ids: [payload.userId],
        requester: 'segment'
      }
    })
  },
  presets,
  actions: {
    logEvent,
    identifyUser,
    mapUser,
    groupIdentifyUser,
    orderCompleted
  }
}

export default destination
