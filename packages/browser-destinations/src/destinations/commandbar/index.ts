import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { initScript } from './init-script'
import { CommandBarClientSDK } from './types'

import identifyUser from './identifyUser'
import { defaultValues } from '@segment/actions-core'

import trackEvent from './trackEvent'

declare global {
  interface Window {
    CommandBar: CommandBarClientSDK
  }
}

export const destination: BrowserDestinationDefinition<Settings, CommandBarClientSDK> = {
  name: 'CommandBar',
  slug: 'actions-commandbar',
  mode: 'device',

  settings: {
    orgId: {
      description: 'The ID of your CommandBar organization.',
      label: 'Organization ID',
      type: 'string',
      required: true
    },
    deploy: {
      description:
        'If enabled, CommandBar will be deployed to your site automatically and you can remove the snippet from your source code.',
      label: 'Deploy via Segment',
      type: 'boolean',
      required: false
    }
  },

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
    }
  ],

  initialize: async ({ settings }, deps) => {
    const preloadedCommandBar = window.CommandBar

    initScript(settings.orgId)

    await deps.resolveWhen(() => {
      return window.CommandBar !== preloadedCommandBar
    }, 100)

    return window.CommandBar
  },

  actions: {
    identifyUser,
    trackEvent
  }
}

export default browserDestination(destination)
