import * as FullStory from '@fullstory/browser'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import event from './event'
import type { Settings } from './generated-types'
import { initScript } from './init-script'
import setUserVars from './setUserVars'

export const destination: BrowserDestinationDefinition<Settings, typeof FullStory> = {
  name: 'Fullstory',
  mode: 'device',
  settings: {
    orgId: {
      description: 'The organization ID for FullStory',
      label: 'orgId',
      type: 'string',
      required: true
    }
  },
  actions: {
    event,
    setUserVars
  },
  initialize: async ({ settings }, dependencies) => {
    initScript({ debug: false, org: settings.orgId })
    await dependencies.loadScript('https://edge.fullstory.com/s/fs.js')
    await dependencies.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'FS'), 100)
    return FullStory
  }
}

export default browserDestination(destination)
