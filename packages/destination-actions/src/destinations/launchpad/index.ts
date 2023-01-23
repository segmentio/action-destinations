import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import groupIdentifyUser from './groupIdentifyUser'

//import { ApiRegions, StrictMode } from './utils'

/** used in the quick setup */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track" and event != "Order Completed"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields)
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
  name: 'Launchpad (Actions)',
  slug: 'actions-launchpad',
  mode: 'cloud',
  // authentication: {
  //   scheme: 'custom',
  //   fields: {
  //     // projectToken: {
  //     //   label: 'Project Token',
  //     //   description: 'Launchpad project token.',
  //     //   type: 'string',
  //     //   required: true
  //     // },
  //     // TODO: maybe we should just require service account instead?
  //     apiSecret: {
  //       label: 'Secret Key',
  //       description: 'Launchpad project secret.',
  //       type: 'string',
  //       required: true
  //     },
  //     apiRegion: {
  //       label: 'Data Residency',
  //       description:
  //         'Learn about [EU data residency](https://help.launchpad.pm)',
  //       type: 'string',
  //       choices: Object.values(ApiRegions).map((apiRegion) => ({ label: apiRegion, value: apiRegion })),
  //       default: ApiRegions.US
  //     },
  //     sourceName: {
  //       label: 'Source Name',
  //       description:
  //         "This value, if it's not blank, will be sent as segment_source_name to Launchpad for every event/page/screen call.",
  //       type: 'string',
  //     },
  //     strictMode: {
  //       label: 'Strict Mode',
  //       description:
  //         "This value, if it's 1 (recommended), Launchpad will validate the events you are trying to send and return errors per event that failed. Learn more about the Launchpad [Import Events API](https://developer.launchpad.pm)",
  //       type: 'string',
  //       choices: Object.values(StrictMode).map((strictMode) => ({ label: strictMode, value: strictMode })),
  //       default: StrictMode.ON
  //     }
  //   },
  //   testAuthentication: (request, { settings }) => {
  //     return request(`https://data.launchpad.pm/api/app/validate-project-credentials/`, { /
  //       method: 'post',
  //       body: JSON.stringify({
  //         api_secret: settings.apiSecret,
  //       })
  //     })
  //   }
  // },
  presets,
  actions: {
    trackEvent,
    identifyUser,
    groupIdentifyUser
  }
}

export default destination
