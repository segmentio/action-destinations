import { DestinationDefinition, ErrorCodes, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { presets } from './presets'
import { baseURL, privacyEndpoint, testEndpoint } from './routes'
import saveBaseEvent from './saveBaseEvent'
import saveCartEvent from './saveCartEvent'
import saveCheckoutEvent from './saveCheckoutEvent'
import saveCollectionEvent from './saveCollectionEvent'
import saveCustomEvent from './saveCustomEvent'
import saveFormEvent from './saveFormEvent'
import saveOrder from './saveOrder'
import saveProductEvent from './saveProductEvent'
import saveSearchEvent from './saveSearchEvent'
import saveUser from './saveUser'

export type AuthResponseType = {
  iat: number
  exp: number
  sub: string
  scopes: string
  iss: string
  jti: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Angler AI',
  slug: 'actions-angler-ai',
  description: 'Send analytics events to Angler AI.',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Authentication Token',
        description: 'Your Angler AI API Authentication Token',
        type: 'password',
        required: true
      },
      workspaceId: {
        label: 'Workspace ID',
        description: 'Your Angler AI Workspace ID',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, options) => {
      const me = await request<AuthResponseType>(baseURL + testEndpoint(), {
        method: 'get'
      })

      if (me.data.sub !== options.settings.workspaceId) {
        throw new IntegrationError(
          'Authentication Invalid. Please Check Workspace Id & Token.',
          ErrorCodes.INVALID_AUTHENTICATION,
          400
        )
      }

      if (!me.data.scopes.split(',').includes('DATA_ADMIN')) {
        throw new IntegrationError(
          'The token provided must have admin privileges.',
          ErrorCodes.INVALID_AUTHENTICATION,
          400
        )
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
        source: 'segment'
      }
    })
  },

  presets,

  actions: {
    saveOrder,
    saveUser,
    saveBaseEvent,
    saveCartEvent,
    saveCheckoutEvent,
    saveCollectionEvent,
    saveCustomEvent,
    saveFormEvent,
    saveProductEvent,
    saveSearchEvent
  }
}

export default destination
