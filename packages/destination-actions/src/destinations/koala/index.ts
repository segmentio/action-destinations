import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import track from './track'

const destination: DestinationDefinition<Settings> = {
  name: 'Koala',
  slug: 'actions-koala',
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
      return request(`https://api2.getkoala.com/web/projects/${settings.public_key}/batch`, { method: 'POST' })
    }
  },

  actions: {
    track
  }
}

export default destination
