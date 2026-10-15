import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { anonymousId, groupId, messageId, timestamp, userId, nestedValueHandling } from '../fields'
import { flattenValues, optionalString, requiredString, send } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Send a track event to Inflection.',
  defaultSubscription: 'type = "track"',
  fields: {
    userId,
    anonymousId,
    event: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    messageId,
    timestamp,
    groupId,
    nestedValueHandling,
    properties: {
      label: 'Properties',
      description: 'Properties of the event.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.properties' }
    }
  },
  perform: (request, { settings, payload }) => {
    const anonymousId = optionalString(payload.anonymousId)
    const groupId = optionalString(payload.groupId)
    const properties = flattenValues(payload.properties, {
      objects: payload.nestedValueHandling?.objectHandling,
      arrays: payload.nestedValueHandling?.arrayHandling
    })
    return send(request, settings, {
      type: 'track',
      userId: requiredString(payload.userId, 'User ID'),
      event: requiredString(payload.event, 'Event Name'),
      messageId: requiredString(payload.messageId, 'Message ID'),
      timestamp: payload.timestamp,
      ...(anonymousId ? { anonymousId } : {}),
      ...(properties ? { properties } : {}),
      ...(groupId ? { context: { groupId } } : {})
    })
  }
}

export default action
