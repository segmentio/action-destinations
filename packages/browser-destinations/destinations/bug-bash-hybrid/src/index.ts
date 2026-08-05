import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import webPlugin from './webPlugin'

// TEMPORARY bug-bash (Row 77, scratch): browser half of the hybrid destination.
// Mirrors the ms-bing-capi two-package pattern (bare slug, mode: device, web action).
// Never merge.
export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Bug Bash Hybrid Browser Plugins',
  slug: 'bug-bash-hybrid',
  mode: 'device',
  initialize: async () => {
    return {}
  },
  settings: {},
  actions: {
    webPlugin
  }
}

export default browserDestination(destination)
