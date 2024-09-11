import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { audienceSync } from '../functions'

// Need to see how this will look within Segment -
// Created this action for now as a placeholder
const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Delete from Audience',
  description: 'Remove users from a Reddit Custom Audience List.',
  fields: {
    audience_id: {
      type: 'string',
      required: true,
      label: 'Audience ID',
      description:
        'The Reddit Audience ID to remove users from. You can find this in your Reddit Audience Manager page.'
    },
    email: {
      type: 'string',
      required: false,
      label: 'User Email',
      description:
        "The user's email address.",
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    maid: {
      type: 'string',
      required: false,
      label: 'Mobile Advertising ID (IDFA, AAID)',
      description:
        "The user's mobile advertising ID (IDFA or AAID)",
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    send_email: {
      type: 'boolean',
      label: 'Remove Email',
      description:
        "Remove emails from the Reddit Custom Audience List.",
      default: true
    },
    send_maid: {
      type: 'boolean',
      label: 'Send Mobile Advertising ID',
      description:
        "Remove Mobile Advertising IDs (IDFA / AAID) from the Reddit Custom Audience List.",
      default: true
    },
    enable_batching: {
      type: 'boolean',
      label: 'Enable Batching',
      description:
        'Enable batching of requests.',
      required: true,
      default: true,
      unsafe_hidden: true
    }
  },
  perform: (request, { payload }) => {
    const action: string = 'REMOVE'
    return audienceSync(request, [payload], action)
  },
  performBatch: (request, { payload }) => {
    const action: string = 'REMOVE'
    return audienceSync(request, payload, action)
  }
}

export default action
