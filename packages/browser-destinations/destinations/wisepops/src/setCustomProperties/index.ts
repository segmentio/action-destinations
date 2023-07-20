import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Wisepops } from '../types'

const action: BrowserActionDefinition<Settings, Wisepops, Payload> = {
  title: 'Set Custom Properties',
  description:
    'Define [custom properties](https://support.wisepops.com/article/yrdyv1tfih-set-up-custom-properties) to let Wisepops target them in your scenarios.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    traits: {
      description: 'The custom properties to send to Wisepops.',
      label: 'Custom Properties',
      type: 'object',
      required: true,
      default: {
        '@path': '$.traits'
      }
    },
    id: {
      description: 'A unique identifier. Typically, a user ID or group ID.',
      label: 'Entity ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    idProperty: {
      description: 'How to name the entity ID among the other custom properties?',
      label: 'Property name for the entity ID',
      type: 'string',
      required: false,
      default: 'userId'
    },
    prefix: {
      description:
        'This lets you define the properties as a nested object. If you set the property `"name"` with the prefix `"group"`, you\'ll access it in Wisepops as `"group.name"`.',
      label: 'Prefix',
      type: 'string',
      required: false
    }
  },
  perform: (wisepops, event) => {
    let properties = event.payload.traits
    if (event.payload.idProperty && event.payload.id) {
      properties[event.payload.idProperty] = event.payload.id
    }
    if (event.payload.prefix) {
      properties = {
        [event.payload.prefix]: properties
      }
    }
    wisepops('properties', properties)
  }
}

export default action
