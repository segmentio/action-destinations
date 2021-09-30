import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import * as FullStory from '@fullstory/browser'
declare global {
  interface Window {
    // setVars is not available on the FS client yet.
    FS: {
      setVars: (eventName: string, eventProperties: object) => {}
    }
  }
}

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, typeof FullStory, Payload> = {
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
  perform: (_, event) => {
    if (event.payload.pageName) {
      window.FS.setVars('page', { pageName: event.payload.pageName, ...event.payload.properties })
    } else if (event.payload.properties) {
      window.FS.setVars('page', event.payload.properties)
    }
  }
}

export default action
