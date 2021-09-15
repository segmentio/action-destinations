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
  description: 'Page events',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    name: {
      type: 'string',
      required: false,
      description: 'The name of the page that was viewed.',
      label: 'name',
      default: {
        '@path': '$.name'
      }
    },
    category: {
      type: 'string',
      required: false,
      description: 'The category of the page that was viewed.',
      label: 'name',
      default: {
        '@path': '$.category'
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'The properties of the page that was viewed.',
      label: 'properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (client, event) => {
    //  * Get the page fullName. This is `$category $name` if both are present, and
    // * just `name` otherwiser.
    const name =
      event.payload.name && event.payload.category
        ? event.payload.category + ' ' + event.payload.name
        : event.payload.name

    if (name && event.settings.trackNamedPages) {
      // named pages
      if (event.settings.trackPagesWithEvents) {
        client.event(`Viewed ${name} Page`, event.payload.properties || {})
      }

      window.FS.setVars('page', { pageName: name, ...event.payload.properties })
    } else if (event.payload.category && event.settings.trackCategorizedPages) {
      // categorized pages
      if (event.settings.trackPagesWithEvents) {
        client.event(`Viewed ${event.payload.category} Page`, event.payload.properties || {})
      }

      window.FS.setVars('page', { pageName: event.payload.category, ...event.payload.properties })
    } else if (event.settings.trackAllPages) {
      // all pages
      if (event.settings.trackPagesWithEvents) {
        client.event('Loaded a Page', event.payload.properties || {})
      }

      window.FS.setVars('page', event.payload.properties || {})
    }
  }
}

export default action
