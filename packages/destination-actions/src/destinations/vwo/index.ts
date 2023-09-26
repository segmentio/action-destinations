import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import pageVisit from './pageVisit'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import syncAudience from './syncAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'VWO Cloud Mode (Actions)',
  slug: 'actions-vwo-cloud',
  mode: 'cloud',
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    },
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'pageVisit',
      mapping: defaultValues(pageVisit.fields),
      type: 'automatic'
    },
    {
      name: 'Sync Audience',
      subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'automatic'
    }
  ],
  authentication: {
    scheme: 'custom',
    fields: {
      vwoAccountId: {
        label: 'Your VWO account ID',
        description: 'Enter your VWO Account ID',
        type: 'number',
        required: true
      },
      apikey: {
        label: 'VWO SDK Key',
        description: 'VWO Fullstack SDK Key. It is mandatory when using the VWO Fullstack suite.',
        type: 'string',
        required: false
      }
    },
    testAuthentication: (_request, { settings }) => {
      if (settings.vwoAccountId < 1 || settings.vwoAccountId.toString().length > 7) {
        throw new Error('Invalid AccountID. Please check your AccountID')
      } else {
        return true
      }
    }
  },

  actions: {
    trackEvent,
    identifyUser,
    pageVisit,
    syncAudience
  }
}

export default destination
