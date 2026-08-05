import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import cloudAction from './cloudAction'

// TEMPORARY bug-bash (Row 77, scratch): the cloud half of a proper hybrid destination.
// Declares only the server-side action; the browser (web) action lives in the browser
// package (@segment/analytics-browser-actions-bug-bash-hybrid) and is merged in at
// manifest-build time via the shared metadataId, mirroring ms-bing-capi. The merged
// destination infers platforms.browser:true AND server:true. Never merge.
const destination: DestinationDefinition<Settings> = {
  name: 'Bug Bash Hybrid',
  slug: 'actions-bug-bash-hybrid',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Scratch bug-bash API key.',
        type: 'string',
        required: true
      }
    }
  },

  actions: {
    cloudAction
  }
}

export default destination
