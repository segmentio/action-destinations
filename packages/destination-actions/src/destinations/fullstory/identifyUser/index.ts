import type { ActionDefinition } from '@segment/actions-core'
import camelCase from 'lodash/camelCase'
import type { Settings } from '../generated-types'
import { setUserPropertiesRequestParams } from '../request-params'

const action: ActionDefinition<Settings> = {
  title: 'Identify User',
  description: 'Sets user identity variables',
  platform: 'cloud',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: true,
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
  perform: (request, { payload, settings }) => {
    const { traits, anonymousId, userId, email, displayName } = payload
    let newTraits: Record<string, unknown> = {}

    if (traits) {
      newTraits = Object.entries(traits).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [camelCaseField(key)]: value
        }),
        {}
      )
    }

    if (anonymousId) {
      newTraits.segmentAnonymousId_str = anonymousId
    }

    // TODO(nate): Include a source value once the HTTP API is updated to support it
    const requestBody = {
      ...newTraits,
      ...(email !== undefined && { email: email }),
      ...(displayName !== undefined && { displayName: displayName })
    }

    const { url, options } = setUserPropertiesRequestParams(settings, userId, requestBody)
    return request(url, options)
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
