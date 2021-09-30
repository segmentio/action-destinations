import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import trackEvent from './trackEvent'
import type { Settings } from './generated-types'

import identifyUser from './identifyUser'
import groupIdentifyUser from './groupIdentifyUser'

import alias from './alias'

/** used in the quick setup */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields)
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'trackEvent',
    mapping: {
      ...defaultValues(trackEvent.fields),
      event_type: {
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
      event_type: {
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
        required: false
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://mixpanel.com/app/api/validate-project-token/`, {
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
    alias
  }
}

export default destination
