import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Wisepops } from '../types'

const action: BrowserActionDefinition<Settings, Wisepops, Payload> = {
  title: 'Set Nested Custom Properties',
  description: 'Define [custom properties](https://support.wisepops.com/article/yrdyv1tfih-set-up-custom-properties) in a nested object.',
  defaultSubscription: 'type = "group"',
  platform: 'web',
  fields: {
    traits: {
      description: "The group's custom properties to send to Wisepops.",
      label: 'Custom Properties',
      type: 'object',
      required: true,
      default: {
        '@path': '$.traits'
      }
    },
    nestedProperty: {
      description: 'The name of the "container" property. In Wisepops, you access the nested properties like this: `container.property`.',
      label: 'Nested Property',
      type: 'string',
      required: true,
      default: 'group',
    },
    groupId: {
      description: 'A unique identifier for the group.',
      label: 'Group ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.groupId'
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
      [event.payload.nestedProperty]: {
        groupId: event.payload.groupId,
        ...event.payload.traits
      }
    }, {
      temporary: !!event.payload.temporary
    });
  }
}

export default action
