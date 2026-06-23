import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues, InvalidAuthenticationError } from '@segment/actions-core'

import pageVisit from './pageVisit'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import syncAudience from './syncAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Wingify Cloud Mode (Actions)',
  slug: 'actions-wingify-cloud',
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
      subscribe: 'type = "track" or type = "identify"',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'automatic'
    }
  ],
  authentication: {
    scheme: 'custom',
    fields: {
      wingifyAccountId: {
        label: 'Your Wingify account ID',
        description: 'Enter your Wingify Account ID',
        type: 'number',
        required: true
      },
      apikey: {
        label: 'Wingify SDK Key',
        description: 'Wingify Fullstack SDK Key. It is mandatory when using the Wingify Fullstack suite.',
        type: 'password',
        required: false
      },
      region: {
        label: 'Region',
        description: 'Wingify Region to sync data to. Default is US',
        type: 'string',
        choices: [
          { label: 'US', value: 'US' },
          { label: 'Europe', value: 'EU' },
          { label: 'Asia', value: 'AS' }
        ],
        default: 'US'
      }
    },
    testAuthentication: (_request, { settings }) => {
      if (settings.wingifyAccountId < 1 || settings.wingifyAccountId.toString().length > 7) {
        throw new InvalidAuthenticationError('Invalid AccountID. Please check your AccountID')
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
