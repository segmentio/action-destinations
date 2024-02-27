import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { LR } from '../types'

type Traits = {
  [propName: string]: string | number | boolean
}

const action: BrowserActionDefinition<Settings, LR, Payload> = {
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
      LogRocket.identify(userId, traits as Traits)
      return
    }
    LogRocket.identify(traits as Traits)
  }
}

export default action
