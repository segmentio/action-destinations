import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { createUserRequestParams } from '../request-params'
import { normalizePropertyNames } from '../vars'

const action: ActionDefinition<Settings> = {
  title: 'Identify User V2',
  description: 'Sets user identity variables. Creates a new FullStory user if no user matching the given uid is found.',
  platform: 'cloud',
  defaultSubscription: 'type = "identify"',
  fields: {
    uid: {
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
    properties: {
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
    const { properties, anonymousId, uid, email, displayName } = payload

    const normalizedProperties = normalizePropertyNames(properties)

    if (anonymousId) {
      normalizedProperties.segmentAnonymousId = anonymousId
    }

    const requestBody = {
      uid,
      ...(email !== undefined && { email }),
      ...(displayName !== undefined && { display_name: displayName }),
      properties: {
        ...normalizedProperties
      }
    }

    const { url, options } = createUserRequestParams(settings, requestBody)
    return request(url, options)
  }
}

export default action
