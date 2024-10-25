import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { endpoints, playerProperties, sendRequest } from '../util'
import type { Payload } from './generated-types'

const mapPayload = (payload: Payload) => {
  delete payload.metadata?.mobile
  return {
    events: {
      [payload.name.trim()]: payload.metadata
    },
    playerUniqueId: payload.playerUniqueId.toLowerCase(),
    mobile: payload.mobile?.toLowerCase(),
    email: payload.email?.toLowerCase()
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: `This action allows you to track and send your players' events to Gameball.`,
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      label: 'Event Name',
      description: 'The name of the event',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    metadata: {
      label: 'Event Metadata',
      description: 'The event metadata to send to Gameball',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    ...playerProperties
  },

  perform: async (request, { payload, settings }) => {
    const endpoint = `${endpoints.baseApiUrl}${endpoints.trackEvent}`
    return await sendRequest(request, endpoint, settings, mapPayload(payload))
  }
}

export default action
