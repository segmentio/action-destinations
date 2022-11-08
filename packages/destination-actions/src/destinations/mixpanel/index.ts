import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import trackEvent from './trackEvent'
import type { Settings } from './generated-types'

import identifyUser from './identifyUser'
import groupIdentifyUser from './groupIdentifyUser'

import alias from './alias'
import { ApiRegions } from './utils'

import trackPurchase from './trackPurchase'

/** used in the quick setup */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track" and event != "Order Completed"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields)
  },
  {
    name: 'Order Completed Calls',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'trackPurchase',
    mapping: defaultValues(trackPurchase.fields)
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
    }
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
    }
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyUser',
    mapping: defaultValues(identifyUser.fields)
  },
  {
    name: 'Group Calls',
    subscribe: 'type = "group"',
    partnerAction: 'groupIdentifyUser',
    mapping: defaultValues(groupIdentifyUser.fields)
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Mixpanel (Actions)',
  slug: 'actions-mixpanel',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      projectToken: {
        label: 'Project Token',
        description: 'Mixpanel project token.',
        type: 'string',
        required: true
      },
      // TODO: maybe we should just require service account instead?
      apiSecret: {
        label: 'Secret Key',
        description: 'Mixpanel project secret.',
        type: 'string',
        required: true
      },
      apiRegion: {
        label: 'Data Residency',
        description:
          'Learn about [EU data residency](https://help.mixpanel.com/hc/en-us/articles/360039135652-Data-Residency-in-EU)',
        type: 'string',
        choices: Object.values(ApiRegions).map((apiRegion) => ({ label: apiRegion, value: apiRegion })),
        default: ApiRegions.US
      },
      sourceName: {
        label: 'Source Name',
        description:
          "This value, if it's not blank, will be sent as segment_source_name to Mixpanel for every event/page/screen call.",
        type: 'string',
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://mixpanel.com/api/app/validate-project-credentials/`, {
        method: 'post',
        body: JSON.stringify({
          api_secret: settings.apiSecret,
          project_token: settings.projectToken
        })
      })
    }
  },
  presets,
  actions: {
    trackEvent,
    identifyUser,
    groupIdentifyUser,
    alias,
    trackPurchase
  }
}

export default destination
