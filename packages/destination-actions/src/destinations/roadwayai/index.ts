import { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import { Settings } from './generated-types'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import groupUser from './groupUser'
import trackPageView from './trackPageView'

const destination: DestinationDefinition<Settings> = {
  name: 'Roadway AI',
  slug: 'roadwayai-actions',
  mode: 'cloud',
  description: 'Send browser events (identify, group, track, etc.) to your RoadwayAI workspace.',

  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Track Page View',
      subscribe: 'type = "page"',
      partnerAction: 'trackPageView',
      mapping: defaultValues(trackPageView.fields),
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
      name: 'Group User',
      subscribe: 'type = "group"',
      partnerAction: 'groupUser',
      mapping: defaultValues(groupUser.fields),
      type: 'automatic'
    }
  ],

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your RoadwayAI API key for authentication',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://app.roadwayai.com/api/v1/segment/validate-credentials`, {
        method: 'POST',
        body: JSON.stringify({
          api_key: settings.apiKey
        })
      })
    }
  },

  actions: {
    groupUser,
    trackEvent,
    identifyUser,
    trackPageView
  }
}

export default destination
