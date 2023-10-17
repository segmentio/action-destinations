import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import addToList from './addToList'
import removeFromList from './removeFromList'

// For an example audience destination, refer to webhook-audiences. The Readme section is under 'Audience Support'
const destination: AudienceDestinationDefinition<Settings> = {
  name: 'Marketo Static Lists',
  slug: 'actions-marketo-static-lists',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {}
  },

  audienceFields: {},

  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule; update as necessary
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    }
  },
  actions: {
    addToList,
    removeFromList
  }
}

export default destination
