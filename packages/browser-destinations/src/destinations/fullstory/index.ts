import * as FullStory from '@fullstory/browser'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import type { Settings } from './generated-types'
import { initScript } from './init-script'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import viewedPage from './viewedPage'
import { defaultValues } from '@segment/actions-core'

export const destination: BrowserDestinationDefinition<Settings, typeof FullStory> = {
  name: 'Fullstory (Actions)',
  slug: 'actions-fullstory',
  mode: 'device',
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
    }
  },
  actions: {
    trackEvent,
    identifyUser,
    viewedPage
  },
  initialize: async ({ settings }, dependencies) => {
    initScript({ debug: settings.debug, org: settings.orgId })
    await dependencies.loadScript('https://edge.fullstory.com/s/fs.js')
    await dependencies.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'FS'), 100)
    return FullStory
  }
}

export default browserDestination(destination)
