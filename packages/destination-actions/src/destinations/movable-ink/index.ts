import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEntireEvent from './sendEntireEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Movable Ink',
  slug: 'actions-movable-ink',
  mode: 'cloud',
  description: 'Send Segment analytics events to Movable Ink',
  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'Username',
        description: 'Your Movable Ink username',
        type: 'string',
        required: true
      },
      password: {
        label: 'Access Secret',
        description: 'Your Movable Ink Access Secret.',
        type: 'string',
        required: true
      },
      movable_ink_url: {
        label: 'Movable Ink URL',
        description: 'The Movable Ink URL to send data to.',
        type: 'string',
        required: true
      }
    }
  },
  extendRequest({ settings }) {
    return {
      username: settings.username,
      password: settings.password
    }
  },
  presets: [
    {
      name: 'Send Entire Event',
      partnerAction: 'sendEntireEvent',
      subscribe: 'type = "identify" or type = "track" or type = "page" or type = "screen" or type = "group"',
      mapping: defaultValues(sendEntireEvent.fields),
      type: 'automatic'
    }
  ],
  actions: {
    sendEntireEvent
  }
}

export default destination
