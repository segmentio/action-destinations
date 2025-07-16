import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import pageVisit from './pageVisit'

export const CLAY_API_BASE_URL = 'https://segment-session.clay.com'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Page Visit',
    subscribe: 'type = "page"',
    partnerAction: 'pageVisit',
    mapping: defaultValues(pageVisit.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Clay',
  slug: 'actions-clay',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      connection_key: {
        label: 'Connection Key',
        description: 'Your Clay connection key for page visit events',
        type: 'string',
        required: true
      },
      secret_key: {
        label: 'Secret Key',
        description: 'Your Clay secret key for page visit events',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`${CLAY_API_BASE_URL}/segment/${settings.connection_key}/auth`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${settings.secret_key}`
        }
      })
    }
  },
  presets,
  actions: {
    pageVisit
  }
}

export default destination
