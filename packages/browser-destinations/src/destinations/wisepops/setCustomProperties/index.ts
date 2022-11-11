import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Wisepops } from '../types'

const action: BrowserActionDefinition<Settings, Wisepops, Payload> = {
  title: 'Set Custom Properties',
  description: 'Define [custom properties](https://support.wisepops.com/article/yrdyv1tfih-set-up-custom-properties) to let Wisepops target them in your scenarios.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    traits: {
      description: "The user's custom properties to send to Wisepops.",
      label: 'Custom Properties',
      type: 'object',
      required: true,
      default: {
        '@path': '$.traits'
      }
    },
    userId: {
      description: 'A unique identifier for the user.',
      label: 'User ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    temporary: {
      description: "By default, custom properties persist across pages. Enable temporary properties to limit them to the current page only.",
      label: 'Temporary Properties',
      type: 'boolean',
      required: false,
      default: false
    }
  },
  perform: (wisepops, event) => {
    wisepops('properties', {
      userId: event.payload.userId,
      ...event.payload.traits
    }, {
      temporary: !!event.payload.temporary
    });
  }
}

export default action
