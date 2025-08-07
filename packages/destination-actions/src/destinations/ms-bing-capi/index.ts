import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'
import pageLoad from './pageLoad'
import { API_URL } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Ms Bing Capi',
  slug: 'actions-ms-bing-capi',
  mode: 'cloud',
  authentication: {
    scheme: 'basic',
    fields: {
      UetTag: {
        label: 'Bing UetTag',
        description: 'Your Bing UetTag.',
        type: 'string',
        required: true
      },
      ApiToken: {
        label: 'Bing ApiToken',
        description: 'Your Bing API Token.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`${API_URL}/${settings.UetTag}/events`, {
        method: 'get'
      })
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        Authorization: `Bearer ${settings.ApiToken}`,
        'Content-Type': 'application/json'
      }
    }
  },
  actions: {
    sendEvent,
    pageLoad
  }
}

export default destination
