import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { FS } from '../types'
import { segmentEventSource } from '..'

const action: BrowserActionDefinition<Settings, FS, Payload> = {
  title: 'Viewed Page',
  description: 'Sets page properties events',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    pageName: {
      type: 'string',
      required: false,
      description: 'The name of the page that was viewed.',
      label: 'Page Name',
      default: {
        '@if': {
          exists: { '@path': '$.category' },
          then: { '@path': '$.category' },
          else: { '@path': '$.name' }
        }
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'The properties of the page that was viewed.',
      label: 'Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (FS, event) => {
    if (event.payload.pageName) {
      FS.setVars('page', { pageName: event.payload.pageName, ...event.payload.properties }, segmentEventSource)
    } else if (event.payload.properties) {
      FS.setVars('page', event.payload.properties, segmentEventSource)
    }
  }
}

export default action
