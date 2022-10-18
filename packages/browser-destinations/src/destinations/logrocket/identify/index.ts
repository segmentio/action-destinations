import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
// import type { Payload } from './generated-types'
import type { LR } from '../types'

const action: BrowserActionDefinition<Settings, LR> = {
  title: 'Identify',
  description: 'Send identification information to logrocket.',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: 'user id',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'A JSON object containing additional traits that will be associated with the user.',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (LogRocket, event) => {
    const { userId, traits } = event.payload
    if (userId) {
      LogRocket.identify(userId, traits)
      return
    }
    LogRocket.identify(traits)
  }
}

export default action
