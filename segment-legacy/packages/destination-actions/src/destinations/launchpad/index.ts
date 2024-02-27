import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import groupIdentifyUser from './groupIdentifyUser'

import { ApiRegions } from './utils'

/** used in the quick setup */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track" and event != "Order Completed"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'trackEvent',
    mapping: {
      ...defaultValues(trackEvent.fields),
      event: {
        '@template': 'Viewed {{name}}'
      }
    },
    type: 'automatic'
  },
  {
    name: 'Screen Calls',
    subscribe: 'type = "screen"',
    partnerAction: 'trackEvent',
    mapping: {
      ...defaultValues(trackEvent.fields),
      event: {
        '@template': 'Viewed {{name}}'
      }
    },
    type: 'automatic'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyUser',
    mapping: defaultValues(identifyUser.fields),
    type: 'automatic'
  },
  {
    name: 'Group Calls',
    subscribe: 'type = "group"',
    partnerAction: 'groupIdentifyUser',
    mapping: defaultValues(groupIdentifyUser.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Launchpad (Actions)',
  slug: 'actions-launchpad',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiSecret: {
        label: 'Secret Key',
        description: 'Launchpad project secret. You can find that in the settings in your Launchpad.pm account.',
        type: 'password',
        required: true
      },
      apiRegion: {
        label: 'Data Residency',
        description: 'Learn about [EU data residency](https://help.launchpad.pm).',
        type: 'string',
        choices: Object.values(ApiRegions).map((apiRegion) => ({ label: apiRegion, value: apiRegion })),
        default: ApiRegions.US
      },
      sourceName: {
        label: 'Source Name',
        description:
          "This value, if it's not blank, will be sent as segment_source_name to Launchpad for every event/page/screen call.",
        type: 'string'
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://backend.launchpad.pm/api/data/validate-project-credentials/`, {
        method: 'post',
        body: JSON.stringify({
          api_secret: settings.apiSecret
        })
      })
    }
  },
  presets,
  actions: {
    trackEvent,
    identifyUser,
    groupIdentifyUser
  }
}

export default destination
