import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// TEMPORARY bug-bash (Row 77, scratch): the browser (web) half of the hybrid destination.
// Registered under its own bare slug (bug-bash-hybrid) alongside the cloud half
// (actions-bug-bash-hybrid). Never merge.
const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Web Plugin',
  description: 'Scratch bug-bash browser plugin action.',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: () => {
    // no-op scratch plugin
    return
  }
}

export default action
