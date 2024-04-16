import type { FS } from './types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { initFullStory } from './types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Settings } from './generated-types'
import trackEvent from './trackEvent'
import trackEventV2 from './trackEventV2'
import identifyUser from './identifyUser'
import identifyUserV2 from './identifyUserV2'
import viewedPage from './viewedPage'
import viewedPageV2 from './viewedPageV2'
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
      partnerAction: 'trackEventV2',
      mapping: defaultValues(trackEventV2.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUserV2',
      mapping: defaultValues(identifyUserV2.fields),
      type: 'automatic'
    },
    {
      name: 'Viewed Page',
      subscribe: 'type = "page"',
      partnerAction: 'viewedPageV2',
      mapping: defaultValues(viewedPageV2.fields),
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
    trackEventV2,
    identifyUser,
    identifyUserV2,
    viewedPage,
    viewedPageV2
  },
  initialize: async ({ settings }, dependencies) => {
    initFullStory(settings)
    await dependencies.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'FS'), 100)
    return window.FS
  }
}

export default browserDestination(destination)
