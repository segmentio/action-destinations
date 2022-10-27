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

// function initScript(orgId: string) {
//   return
// }

export const destination: BrowserDestinationDefinition<Settings, CommandBarClientSDK> = {
  name: 'Command Bar',
  slug: 'commandbar',
  mode: 'device',

  settings: {
    orgId: {
      description: 'The ID of your CommandBar organization.',
      label: 'Organization ID',
      type: 'string',
      required: true
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
    }, 500)

    return window.CommandBar
  },

  actions: {
    identifyUser,
    trackEvent
  }
}

export default browserDestination(destination)
