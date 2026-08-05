import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// platform: 'web' marks this as a browser/device action, so inferPlatforms sets browser:true.
const action: ActionDefinition<Settings, Payload> = {
  title: 'Web Action',
  description: 'Scratch bug-bash web (browser) action.',
  platform: 'web',
  fields: {
    name: {
      label: 'Name',
      description: 'A name.',
      type: 'string',
      required: false
    }
  },
  perform: () => {
    // no-op scratch action
  }
}

export default action
