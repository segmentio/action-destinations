import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: 'StackAdapt',
  slug: 'actions-stackadapt',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      pixelId: {
        label: 'Universal Pixel ID',
        description: 'Your StackAdapt Universal Pixel ID',
        type: 'string',
        required: true
      }
    }
  },

  actions: {}
}

export default destination
