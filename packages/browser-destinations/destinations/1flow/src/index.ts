import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import trackEvent from './trackEvent'
import { initScript } from './1flow'
import { _1Flow } from './api'
import identifyUser from './identifyUser'
import { defaultValues } from '@segment/actions-core'
declare global {
  interface Window {
    _1Flow: _1Flow
  }
}

export const destination: BrowserDestinationDefinition<Settings, _1Flow> = {
  name: '1Flow',
  slug: 'actions-1flow',
  mode: 'device',

  settings: {
    projectApiKey: {
      description: 'The app_id of your 1Flow app which will indicate where to store any data.',
      label: 'Project API Key',
      type: 'string',
      required: true
    }
  },
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
    }
  ],

  initialize: async ({ settings }, deps) => {
    const projectApiKey = settings.projectApiKey
    initScript({ projectApiKey })
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, '_1Flow'), 100)
    return window._1Flow
  },
  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
