import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import track from './track'
import identify from './identify'

export const KOALA_PATH =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001/web/projects'
    : 'https://api2.getkoala.com/web/projects'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'track',
    mapping: defaultValues(track.fields),
    type: 'automatic'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identify',
    mapping: defaultValues(identify.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Koala (Cloud)',
  slug: 'actions-koala-cloud',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      public_key: {
        label: 'Public Key',
        description: 'Your public key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`${KOALA_PATH}/${settings.public_key}/auth`, { method: 'get' })
    }
  },
  presets,
  actions: {
    track,
    identify
  }
}

export default destination
