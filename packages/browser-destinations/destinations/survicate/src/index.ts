import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { defaultValues } from '@segment/actions-core'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import identifyGroup from './identifyGroup'
import { Survicate } from './types'

declare global {
  interface Window {
    _sva: Survicate
  }
}

export const destination: BrowserDestinationDefinition<Settings, Survicate> = {
  name: 'Survicate (Actions)',
  slug: 'actions-survicate',
  mode: 'device',
  description: 'Send user traits to Survicate and trigger surveys with Segment events',

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
    },
    {
      name: 'Identify Group',
      subscribe: 'type = "group"',
      partnerAction: 'identifyGroup',
      mapping: defaultValues(identifyGroup.fields),
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
      await deps.resolveWhen(() => window._sva != undefined, 100)
      return window._sva
    } catch (error) {
      throw new Error('Failed to load Survicate. ' + error)
    }
  },

  actions: {
    trackEvent,
    identifyUser,
    identifyGroup
  }
}

export default browserDestination(destination)
