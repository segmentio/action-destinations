import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import computedAttributeSync from './computedAttributeSync'
import audienceSync from './audienceSync'

const destination: DestinationDefinition<Settings> = {
  name: 'Contentstack',
  slug: 'actions-contentstack',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      personalizeProjectId: {
        label: 'Personalize project ID',
        type: 'string',
        required: true,
        description: "Your Personalize project ID to which Segment's data should be synced."
      },
      personalizeEdgeApiBaseUrl: {
        label: 'Personalize Edge API base URL',
        type: 'string',
        required: true,
        description: 'Your region-based personalize-edge API base URL.'
      }
    }
  },
  actions: {
    computedAttributeSync,
    audienceSync
  }
}

export default destination
