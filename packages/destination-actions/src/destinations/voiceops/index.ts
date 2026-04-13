import { defaultValues, InvalidAuthenticationError } from '@segment/actions-core'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendCallCompleted from './sendCallCompleted'
import { SEGMENT_USER_AGENT, VOICEOPS_AUTHENTICATION_ENDPOINT } from './constants'

function buildHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': SEGMENT_USER_AGENT
  }
}

const destination: DestinationDefinition<Settings> = {
  name: 'Voiceops',
  slug: 'actions-voiceops',
  mode: 'cloud',
  description:
    'Send Segment call-completed events to Voiceops for call ingestion, conference bridge splitting, and agent attribution.',

  presets: [
    {
      name: 'Send Call Completed',
      subscribe: 'type = "track" and event = "call_completed"',
      partnerAction: 'sendCallCompleted',
      mapping: defaultValues(sendCallCompleted.fields),
      type: 'automatic'
    }
  ],

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Access Token',
        description: 'Your Voiceops access token.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      try {
        return await request(VOICEOPS_AUTHENTICATION_ENDPOINT, {
          method: 'get',
          headers: buildHeaders(settings.accessToken)
        })
      } catch (error: unknown) {
        const authError = error as {
          response?: {
            data?: {
              message?: string
              error?: string
            }
          }
        }
        const message =
          authError.response?.data?.message ?? authError.response?.data?.error ?? 'Invalid Voiceops access token'

        throw new InvalidAuthenticationError(message)
      }
    }
  },

  extendRequest: ({ settings }) => {
    return {
      headers: buildHeaders(settings.accessToken)
    }
  },

  actions: {
    sendCallCompleted
  }
}

export default destination
