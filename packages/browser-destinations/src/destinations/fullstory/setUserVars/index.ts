import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import * as FullStory from '@fullstory/browser'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, typeof FullStory, Payload> = {
  title: 'Set User Vars',
  description: 'Sets user identity variables',
  platform: 'web',
  defaultSubscription: "type = 'identify'",
  fields: {
    displayName: {
      type: 'string',
      required: false,
      description: "The user's display name",
      label: 'displayName'
    },
    email: {
      type: 'string',
      required: false,
      description: "The user's email",
      label: 'email'
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to FullStory',
      label: 'traits'
    }
  },
  perform: (client, event) => {
    client.setUserVars({
      ...event.payload.traits,
      email: event.payload.email,
      displayName: event.payload.displayName
    })
  }
}

export default action
