import type { FS } from './types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { FSPackage } from './types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Settings } from './generated-types'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import viewedPage from './viewedPage'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    FS: FS
  }
}

export const segmentEventSource = 'segment-browser-actions'

export const destination: BrowserDestinationDefinition<Settings, FS> = {
  name: 'Fullstory (Actions)',
  slug: 'actions-fullstory',
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
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    }
  ],
  settings: {
    orgId: {
      description: 'The organization ID for FullStory.',
      label: 'FS Org',
      type: 'string',
      required: true
    },
    debug: {
      description: 'Enables FullStory debug mode.',
      label: 'Debug mode',
      type: 'boolean',
      required: false,
      default: false
    },
    recordOnlyThisIFrame: {
      description: 'Enables FullStory inside an iframe.',
      label: 'Capture only this iFrame',
      type: 'boolean',
      required: false,
      default: false
    }
  },
  actions: {
    trackEvent,
    identifyUser,
    viewedPage
  },
  initialize: async ({ settings }, dependencies) => {
    FSPackage.init(settings)
    await dependencies.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'FS'), 100)
    return window.FS
  }
}

export default browserDestination(destination)
