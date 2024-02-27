import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { setUserPropertiesRequestParams } from '../request-params'
import { normalizePropertyNames } from '../vars'

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

    const normalizedTraits = normalizePropertyNames(traits, { camelCase: true, typeSuffix: true })

    if (anonymousId) {
      normalizedTraits.segmentAnonymousId_str = anonymousId
    }

    const requestBody = {
      ...normalizedTraits,
      ...(email !== undefined && { email }),
      ...(displayName !== undefined && { displayName })
    }

    const { url, options } = setUserPropertiesRequestParams(settings, userId, requestBody)
    return request(url, options)
  }
}

export default action
