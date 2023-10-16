import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import { API_URL, REVISION_DATE } from './config'
import upsertProfile from './upsertProfile'
import addProfileToList from './addProfileToList'
import removeProfileToList from './removeProfileToList'
import trackEvent from './trackEvent'
import orderCompleted from './orderCompleted'

const destination: DestinationDefinition<Settings> = {
  name: 'Klaviyo (Actions)',
  slug: 'actions-klaviyo',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        type: 'string',
        label: 'API Key',
        description: `You can find this by going to Klaviyo's UI and clicking Account > Settings > API Keys > Create API Key`,
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`${API_URL}/accounts/`, {
        method: 'get'
      })
    }
  },

  onDelete: async (request, { payload }) => {
    return request(`${API_URL}/data-privacy-deletion-jobs/`, {
      method: 'post',
      json: {
        data: {
          type: 'data-privacy-deletion-job',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                id: payload.userId
              }
            }
          }
        }
      }
    })
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Klaviyo-API-Key ${settings.api_key}`,
        Accept: 'application/json',
        revision: REVISION_DATE
      }
    }
  },

  actions: {
    upsertProfile,
    addProfileToList,
    removeProfileToList,
    trackEvent,
    orderCompleted
  }
}

export default destination
