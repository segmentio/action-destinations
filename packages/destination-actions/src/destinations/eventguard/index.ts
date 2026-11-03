import { defaultValues, PayloadValidationError } from '@segment/actions-core'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { API_BASE_URL } from './api'
import sendTrack from './sendTrack'

const destination: DestinationDefinition<Settings> = {
  name: 'EventGuard',
  slug: 'actions-eventguard',
  mode: 'cloud',
  description: 'Monitor Segment Track events for tracking-plan violations in EventGuard.',
  authentication: {
    scheme: 'custom',
    fields: {
      connectionKey: {
        label: 'EventGuard connection key',
        description: 'The key for this source connection in your EventGuard workspace.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`${API_BASE_URL}/connection`, {
        method: 'GET',
        redirect: 'error',
        timeout: 5000
      })
    }
  },
  extendRequest: ({ settings }) => {
    if (
      !settings.connectionKey ||
      /\s/.test(settings.connectionKey) ||
      Array.from(settings.connectionKey).some((character) => {
        const code = character.charCodeAt(0)
        return code < 32 || code === 127
      })
    ) {
      throw new PayloadValidationError('Enter a valid EventGuard connection key.')
    }
    return { headers: { Authorization: `Bearer ${settings.connectionKey}` } }
  },
  actions: { sendTrack },
  presets: [
    {
      name: 'Monitor Track events',
      type: 'automatic',
      subscribe: 'type = "track"',
      partnerAction: 'sendTrack',
      mapping: defaultValues(sendTrack.fields)
    }
  ]
}

export default destination
