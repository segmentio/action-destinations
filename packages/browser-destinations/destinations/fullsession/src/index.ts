import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { FUS } from './types'
import { fullSessionTracker } from './types'
import identifyUser from './identifyUser'
import { defaultValues } from '@segment/actions-core'

import recordEvent from './recordEvent'

// import visitPage from './visitPage'

declare global {
  interface Window {
    FUS: FUS
  }
}
// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, FUS> = {
  name: 'FullSession',
  slug: 'actions-fullsession',
  mode: 'device',
  presets: [
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    },
    {
      name: 'Record Event',
      subscribe: 'type = "track"',
      partnerAction: 'recordEvent',
      mapping: defaultValues(recordEvent.fields)
    }
    // {
    //   name: 'Visit Page',
    //   subscribe: 'type = "page"',
    //   partnerAction: 'visitPage',
    //   mapping: defaultValues(visitPage.fields)
    // }
  ],
  settings: {
    customerId: {
      description: 'The Customer ID for FullSession.',
      label: 'FullSession Customer',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    fullSessionTracker.initialize(settings.customerId)
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'FUS'), 1000)
    return fullSessionTracker
  },

  actions: {
    identifyUser,
    recordEvent
    // visitPage
  }
}

export default browserDestination(destination)
