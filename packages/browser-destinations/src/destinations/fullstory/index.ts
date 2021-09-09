import * as FullStory from '@fullstory/browser'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import type { Settings } from './generated-types'
import { initScript } from './init-script'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import viewedPage from './viewedPage'

export const destination: BrowserDestinationDefinition<Settings, typeof FullStory> = {
  name: 'Fullstory',
  slug: 'actions-fullstory',
  mode: 'device',
  settings: {
    orgId: {
      description: 'The organization ID for FullStory.',
      label: 'orgId',
      type: 'string',
      required: true
    },
    trackAllPages: {
      description: 'Sends all page calls as tracking events to FullStory.',
      label: 'trackAllPages',
      type: 'boolean',
      required: false,
      default: false
    },
    trackNamedPages: {
      description: 'Sends pages with names to FullStory as tracking events.',
      label: 'trackNamedPages',
      type: 'boolean',
      required: false,
      default: false
    },
    trackCategorizedPages: {
      description: 'Sends pages that specify a category to Fullstory as tracking events.',
      label: 'trackCategorizedPages',
      type: 'boolean',
      required: false,
      default: false
    },
    trackPagesWithEvents: {
      description: 'Sends pages to FullStory as tracking events.',
      label: 'trackPagesWithEvents',
      type: 'boolean',
      required: false,
      default: true
    }
  },
  actions: {
    trackEvent,
    identifyUser,
    viewedPage
  },
  initialize: async ({ settings }, dependencies) => {
    initScript({ debug: false, org: settings.orgId })
    await dependencies.loadScript('https://edge.fullstory.com/s/fs.js')
    await dependencies.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'FS'), 100)
    return FullStory
  }
}

export default browserDestination(destination)
