import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { AuthRepsponseType } from './utils'
import { testEnpoint, privacyEndpoint } from './utils'
import { presets } from './presets'
import saveEvent from './saveEvent'
import saveOrder from './saveOrder'
import saveUser from './saveUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Angler Ai',
  slug: 'actions-angler-ai',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Authentication Token',
        description: 'Your Angler AI API Authentication Token',
        type: 'string',
        required: true
      },
      workspaceId: {
        label: 'Authentication Token',
        description: 'Your Angler AI Workspace ID',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, options) => {
      const me = await request<AuthRepsponseType>(testEnpoint(), {
        method: 'get'
      })

      if (me.data.sub !== options.settings.workspaceId) {
        throw new Error('Authentication Invalid. Please Check Workspace Id & Token.')
      }

      if (!me.data.scopes.split(',').includes('DATA_ADMIN')) {
        throw new Error('The token provided must have admin privileges.')
      }
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { Authorization: `Bearer ${settings.accessToken}` }
    }
  },

  onDelete: async (request, { settings, payload }) => {
    return request(privacyEndpoint(settings.workspaceId), {
      method: 'post',
      json: {
        customer: {
          id: payload.userId
        },
        source: 'segment',
        additional_properties: {
          anonymousId: payload.anonymousId
        }
      }
    })
  },

  presets,

  actions: {
    saveEvent,
    saveOrder,
    saveUser
  }
}

export default destination
