import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import webAction from './webAction'
import cloudAction from './cloudAction'

// TEMPORARY bug-bash (Row 77, scratch): a hybrid destination that defines BOTH a
// platform:'web' action and a platform:'cloud' action, to verify the bot infers
// platforms.browser:true AND platforms.server:true and handles same-mode pushes
// without spurious cross-mode diffs. Never merge.
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
    webAction,
    cloudAction
  }
}

export default destination
