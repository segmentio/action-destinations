import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import trackEvent from './trackEvent'
import { defaultValues } from '@segment/actions-core/*'

import identifyUser from './identifyUser'

declare global {
  interface Window {
    _sva: any
  }
}

export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Survicate',
  slug: 'actions-survicate',
  mode: 'device',

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
      subscribe: 'type = "identify" or type = "group"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    }
  ],

  settings: {
    workspaceKey: {
      description: 'The workspace key for your Survicate account.',
      label: 'Workspace Key',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    try {
      await deps.loadScript(`https://survey.survicate.com/workspaces/${settings.workspaceKey}/web_surveys.js`)
      await deps.resolveWhen(() => window._sva != undefined, 250)
      return window._sva
    } catch (error) {
      throw new Error('Failed to load Survicate. ' + error)
    }
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
