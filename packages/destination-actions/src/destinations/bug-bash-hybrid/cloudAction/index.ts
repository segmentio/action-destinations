import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// platform defaults to 'cloud' (server-side), so inferPlatforms sets server:true.
const action: ActionDefinition<Settings, Payload> = {
  title: 'Cloud Action',
  description: 'Scratch bug-bash cloud (server) action.',
  platform: 'cloud',
  fields: {
    userId: {
      label: 'User ID',
      description: 'A user id.',
      type: 'string',
      required: false
    }
  },
  perform: () => {
    // no-op scratch action
  }
}

export default action
