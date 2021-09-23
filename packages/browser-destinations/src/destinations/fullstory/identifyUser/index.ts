import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import * as FullStory from '@fullstory/browser'
import { camelCase } from 'lodash'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, typeof FullStory, Payload> = {
  title: 'Identify User',
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
  perform: (client, event) => {
    let newTraits: Record<string, unknown> = {}

    if (event.payload.traits) {
      newTraits = Object.entries(event.payload.traits).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [camelCaseField(key)]: value
        }),
        {}
      )
    }

    if (event.payload.anonymousId) {
      newTraits.segmentAnonymousId_str = event.payload.anonymousId
    }

    if (event.payload.userId) {
      client.identify(event.payload.userId, newTraits)
    } else {
      client.setUserVars({
        ...newTraits,
        ...(event.payload.email !== undefined && { email: event.payload.email }),
        ...(event.payload.displayName !== undefined && { displayName: event.payload.displayName })
      })
    }
  }
}

/**
 * Camel cases `.`, `-`, `_`, and white space within fieldNames. Leaves type suffix alone.
 *
 * NOTE: Does not fix otherwise malformed fieldNames.
 * FullStory will scrub characters from keys that do not conform to /^[a-zA-Z][a-zA-Z0-9_]*$/.
 *
 * @param {string} fieldName
 */
function camelCaseField(fieldName: string) {
  // Do not camel case across type suffixes.
  const parts = fieldName.split('_')
  if (parts.length > 1) {
    const typeSuffix = parts.pop()
    switch (typeSuffix) {
      case 'str':
      case 'int':
      case 'date':
      case 'real':
      case 'bool':
      case 'strs':
      case 'ints':
      case 'dates':
      case 'reals':
      case 'bools':
        return camelCase(parts.join('_')) + '_' + typeSuffix
      default: // passthrough
    }
  }

  // No type suffix found. Camel case the whole field name.
  return camelCase(fieldName)
}

export default action
