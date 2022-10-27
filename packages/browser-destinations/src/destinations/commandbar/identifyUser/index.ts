import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import { CommandBarClientSDK } from '../types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, CommandBarClientSDK, Payload> = {
  title: 'Identify User',
  description: '',
  platform: 'web',
  fields: {
    userId: {
      type: 'string',
      required: true,
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    // hmac: {
    //   description:
    //     'The user hash used for identity verification. See [Intercom docs](https://www.intercom.com/help/en/articles/183-enable-identity-verification-for-web-and-mobile) for more information on how to set this field.',
    //   label: 'User Hash',
    //   type: 'string',
    //   required: false,
    //   default: {
    //     '@path': '$.context.CommandBar.hmac'
    //   }
    // },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to CommandBar',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (CommandBar, event) => {
    const traits = event.payload.traits || {}

    // CommandBar.boot(event.payload.userId, traits, { ...(!!event.payload.hmac && { hmac: event.payload.hmac }) })
    CommandBar.boot(event.payload.userId, traits, {})
  }
}

export default action
