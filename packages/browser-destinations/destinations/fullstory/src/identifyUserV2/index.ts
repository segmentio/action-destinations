import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { FS } from '../types'
import { segmentEventSource } from '..'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, FS, Payload> = {
  title: 'Identify User V2',
  description: 'Sets user identity variables',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: "The user's anonymous id",
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    displayName: {
      type: 'string',
      required: false,
      description: "The user's display name",
      label: 'Display Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    email: {
      type: 'string',
      required: false,
      description: "The user's email",
      label: 'Email',
      default: {
        '@path': '$.traits.email'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to FullStory',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (FS, event) => {
    const newTraits: Record<string, unknown> = event.payload.traits || {}

    if (event.payload.anonymousId) {
      newTraits.segmentAnonymousId = event.payload.anonymousId
    }

    const userProperties = {
      ...newTraits,
      ...(event.payload.email !== undefined && { email: event.payload.email }),
      ...(event.payload.displayName !== undefined && { displayName: event.payload.displayName })
    }

    if (event.payload.userId) {
      FS(
        'setIdentity',
        {
          uid: event.payload.userId,
          properties: userProperties
        },
        segmentEventSource
      )
    } else {
      FS(
        'setProperties',
        {
          type: 'user',
          properties: userProperties
        },
        segmentEventSource
      )
    }
  }
}

export default action
