import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { FUS } from '../types'

const action: BrowserActionDefinition<Settings, FUS, Payload> = {
  title: 'Identify User',
  description: 'Describe your users',
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
    name: {
      type: 'string',
      required: false,
      description: "The user's name",
      label: 'Name',
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
      description: 'The Segment traits to be forwarded to FullSession',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (FUS, data) => {
    const { userId, anonymousId, name, email, traits = {} } = data.payload

    // Build the user traits object for identify
    const identifyTraits = {
      name: name ?? '',
      email: email ?? ''
    }

    // Only call identify if we have a userId or anonymousId
    if (userId) {
      FUS.identify(userId, identifyTraits)
    } else if (anonymousId) {
      FUS.identify(anonymousId, identifyTraits)
    }

    // Remove name and email from traits before sending to setSessionAttributes
    const { name: _ignoredName, email: _ignoredEmail, ...restTraits } = traits || {}

    // Build session attributes
    const sessionAttributes = {
      ...restTraits,
      ...(anonymousId ? { segmentAnonymousId: anonymousId } : {})
    }

    // Only call if we have something to set
    if (Object.keys(sessionAttributes).length > 0) {
      FUS.setSessionAttributes(sessionAttributes)
    }
  }
}

export default action
