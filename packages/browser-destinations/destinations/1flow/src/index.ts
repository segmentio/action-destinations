import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import trackEvent from './trackEvent'
import { initScript } from './1flow'
import { _1Flow } from './api'
import identifyUser from './identifyUser'
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

  initialize: async ({ settings }) => {
    const projectApiKey = settings.projectApiKey
    initScript({ projectApiKey })
    return window._1Flow
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
