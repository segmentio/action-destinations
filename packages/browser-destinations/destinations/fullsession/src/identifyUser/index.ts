import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { FUS } from '../types'

const action: BrowserActionDefinition<Settings, FUS, Payload> = {
  title: 'Identify User',
  description: 'Identify users and set their properties in FullSession.',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: "The user's unique identifier.",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: "The user's anonymous identifier when no user ID is available.",
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'User traits and properties to be sent to FullSession.',
      label: 'User Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (FUS, data) => {
    const { userId, anonymousId, traits = {} } = data.payload

    // Build the user traits object for identify
    const identifyTraits = {
      name: (traits.name as string) ?? '',
      email: (traits.email as string) ?? ''
    }

    // call the identify function on either the userId or anonymousId

    FUS.identify(userId ?? (anonymousId as string), identifyTraits)

    // Remove name and email from traits before sending to setSessionAttributes
    const { name: _ignoredName, email: _ignoredEmail, ...restTraits } = traits || {}

    // Build session attributes
    const sessionAttributes = {
      ...restTraits,
      ...(anonymousId ? { segmentAnonymousId: anonymousId } : {})
    }

    FUS.setSessionAttributes(sessionAttributes)
  }
}

export default action
