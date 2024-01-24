import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import addToContactList from './addToContactList'
import removeFromContactList from './removeFromContactList'
import triggerEvent from './triggerEvent'
import upsertContact from './upsertContact'
import { createWsseHeader, API_BASE } from './emarsys-helper'

const destination: DestinationDefinition<Settings> = {
  name: 'Emarsys (Actions)',
  slug: 'actions-emarsys',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_user: {
        label: 'API username',
        description: 'Your Emarsys API username',
        type: 'string',
        required: true
      },
      api_password: {
        label: 'API password',
        description: 'Your Emarsys API password.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request) => {
      const data = await request(`${API_BASE}settings`)
      if (data && data.content) {
        const api_data = JSON.parse(data.content)
        if (api_data && api_data.replyCode !== undefined && api_data.replyCode == 0) {
          if (api_data.data && api_data.data.id) {
            if (api_data.data.id > 0) {
              return true
            }
          }
        }
      }
      throw new Error('Authentication failed')
    }
  },

  actions: {
    upsertContact,
    addToContactList,
    removeFromContactList,
    triggerEvent
  },

  extendRequest: ({ settings }) => {
    return {
      headers: { 'X-WSSE': createWsseHeader(settings) },
      responseType: 'json'
    }
  }
}

export default destination
