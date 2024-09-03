import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import customAttributesSync from './customAttributesSync'
import eventsSync from './eventsSync'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Contentstack Web',
  slug: 'contentstack-web',
  mode: 'device',
  description: 'Sync web event and user profile data from Segment to Contentstack',
  settings: {
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
  },
  initialize: async () => {
    return {}
  },
  actions: {
    customAttributesSync,
    eventsSync
  }
}

export default browserDestination(destination)
