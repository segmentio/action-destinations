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
    }, 
    host: {
      label: 'Host',
      description: "The recording server host domain. Can be set to direct recorded events to a proxy that you host. Defaults to 'fullstory.com'.",
      type: 'string',
      required: false
    }, 
    appHost: {
      label: 'App Host',
      description: 'The App Host is used to define the specific base URL for the Fullstory application where session URLs are generated and displayed.',
      type: 'string',
      required: false
    }, 
    script: {
      label: 'Custom Script URL',
      description: "Optionally specify a custom FullStory script URL. Useful if you are self-hosting the FullStory script or using a proxy. The detault is 'edge.fullstory.com/s/fs.js'.",
      type: 'string',
      required: false
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

    const { 
      host, 
      appHost,
      script
    } = settings

    const inputOptions = {
      ...settings, 
      ...(host ? { host } : {}),
      ...(appHost ? { appHost } : {}),
      ...(script ? { script } : {})
    } 

    initFullStory(inputOptions)
    await dependencies.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'FS'), 100)
    return window.FS
  }
}

export default browserDestination(destination)
