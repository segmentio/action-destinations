import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import * as FullStory from '@fullstory/browser'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, typeof FullStory, Payload> = {
  title: 'Viewed Page',
  description: 'Page events',
  defaultSubscription: "type = 'page'",
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
        client.event(name, event.payload.properties || {})
      }

      // @ts-ignore setVars in beta
      window.FS.setVars('page', { pageName: name, ...event.payload.properties })
    } else if (event.payload.category && event.settings.trackCategorizedPages) {
      // categorized pages
      if (event.settings.trackPagesWithEvents) {
        client.event(event.payload.category, event.payload.properties || {})
      }

      // @ts-ignore setVars in beta
      window.FS.setVars('page', { pageName: event.payload.category, ...event.payload.properties })
    } else if (event.settings.trackAllPages) {
      // all pages
      if (event.settings.trackPagesWithEvents) {
        client.event(event.payload.name || '', event.payload.properties || {})
      }

      // @ts-ignore setVars in beta
      window.FS.setVars('page', event.payload.properties)
    }
  }
}

export default action
