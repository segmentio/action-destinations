import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendTrackEvent from './sendTrackEvent'
import sendIdentifyEvent from './sendIdentifyEvent'
import sendGroupEvent from './sendGroupEvent'
import sendPageEvent from './sendPageEvent'
import sendScreenEvent from './sendScreenEvent'
import { getAuthUrl } from './api'

const destination: DestinationDefinition<Settings> = {
  name: 'Canvas',
  slug: 'actions-canvas',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        label: 'API Token',
        description: 'API token generated by Canvas',
        type: 'password'
      }
    },
    testAuthentication: (request) => {
      return request(getAuthUrl())
    }
  },
  extendRequest({ settings: { apiToken } }) {
    return {
      headers: {
        Authorization: `Bearer ${apiToken}`
      }
    }
  },

  presets: [
    {
      name: sendTrackEvent.title,
      subscribe: 'type = "track"',
      partnerAction: 'sendTrackEvent',
      mapping: defaultValues(sendTrackEvent.fields),
      type: 'automatic'
    },
    {
      name: sendIdentifyEvent.title,
      subscribe: 'type = "identify"',
      partnerAction: 'sendIdentifyEvent',
      mapping: defaultValues(sendIdentifyEvent.fields),
      type: 'automatic'
    },
    {
      name: sendGroupEvent.title,
      subscribe: 'type = "group"',
      partnerAction: 'sendGroupEvent',
      mapping: defaultValues(sendGroupEvent.fields),
      type: 'automatic'
    },
    {
      name: sendPageEvent.title,
      subscribe: 'type = "page"',
      partnerAction: 'sendPageEvent',
      mapping: defaultValues(sendPageEvent.fields),
      type: 'automatic'
    },
    {
      name: sendScreenEvent.title,
      subscribe: 'type = "screen"',
      partnerAction: 'sendScreenEvent',
      mapping: defaultValues(sendScreenEvent.fields),
      type: 'automatic'
    }
  ],

  actions: {
    sendTrackEvent,
    sendIdentifyEvent,
    sendGroupEvent,
    sendPageEvent,
    sendScreenEvent
  }
}

export default destination
