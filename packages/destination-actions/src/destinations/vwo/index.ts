import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import pageVisit from './pageVisit'

const destination: DestinationDefinition<Settings> = {
  name: 'VWO Cloud Mode (Actions)',
  slug: 'actions-vwo-cloud',
  mode: 'cloud',
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    },
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'pageVisit',
      mapping: defaultValues(pageVisit.fields)
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
    pageVisit
  }
}

export default destination
