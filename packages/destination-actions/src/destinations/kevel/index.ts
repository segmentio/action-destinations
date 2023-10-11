import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Kevel',
  slug: 'actions-kevel',
  description: 'Send Segment Engage Audiences to Kevel',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      kevelURL: {
        label: 'Kevel Segments Webhook URL',
        description:
          "The URL Segment will use to send Audience data to Kevel. If you don't have a URL, contact the Kevel Customer Success team.",
        type: 'string',
        required: true
      },
      userIdType: {
        label: 'User ID Type',
        description:
          "The Kevel Platform User Identifier Type. Contact the Kevel Customer Success team if you are unsure what this is.",
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(settings.kevelURL)
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
