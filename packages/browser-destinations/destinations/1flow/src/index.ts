import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import trackEvent from './trackEvent'
import { initScript } from './1flow'
import { _1flow } from './api'
import identifyUser from './identifyUser'
import { defaultValues } from '@segment/actions-core'
declare global {
  interface Window {
    _1flow: _1flow
  }
}

export const destination: BrowserDestinationDefinition<Settings, _1flow> = {
  name: '1Flow Web (Actions)',
  slug: 'actions-1flow',
  mode: 'device',
  description: 'Send analytics from Segment to 1Flow',
  settings: {
    projectApiKey: {
      description:
        'This is the unique app_id for your 1Flow application, serving as the identifier for data storage and retrieval. This field is mandatory.',
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
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, '_1flow'), 100)
    return window._1flow
  },
  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
