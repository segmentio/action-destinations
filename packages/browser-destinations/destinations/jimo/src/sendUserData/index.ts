import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { JimoSDK } from 'src/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, JimoSDK, Payload> = {
  title: 'Send User Data',
  description: "Use segment user's data to enrich the associated jimo user's profile",
  platform: 'web',
  fields: {
    userId: {
      label: 'User ID',
      description: "The users's id provided by segment",
      type: 'string',
      allowNull: true,
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      label: 'User email',
      description: 'The email of the user',
      type: 'string',
      allowNull: true,
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    }
  },
  defaultSubscription: 'type = "identify"',
  perform: (jimo, { payload }) => {
    if (payload.userId != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      jimo.push(['set', 'user:id', [payload.userId]])
    }
    if (payload.email != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      jimo.push(['set', 'user:email', [payload.email]])
    }
  }
}

export default action
