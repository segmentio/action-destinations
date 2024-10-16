import { PayloadValidationError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SetViewPortion, RecombeeApiClient, Batch } from '../recombeeApiClient'
import { interactionFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Set View Portion from Watch Time',
  description:
    'Sets the viewed portion of a given item (e.g. a video or article) by the given user. **Use this action when you have the watch time of the item (e.g. in seconds) instead of the portion watched.**',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The ID of the user who viewed a portion of the item.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    itemId: {
      label: 'Item ID',
      description: 'The viewed item.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.product_id' },
          then: { '@path': '$.properties.product_id' },
          else: { '@path': '$.properties.asset_id' }
        }
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The UTC timestamp of when the view portion occurred.',
      type: 'string',
      required: false,
      default: { '@path': '$.timestamp' }
    },
    portion: {
      label: 'Portion',
      description: 'The portion of the item that the user viewed.',
      type: 'object',
      required: true,
      properties: {
        totalLength: {
          label: 'Total Length',
          description: 'The total length of the item that the user can view (for example, in seconds or minutes).',
          type: 'number',
          required: true
        },
        watchTime: {
          label: 'Watch Time',
          description: "The user's watched time of the item (measured in the same units as Total Length).",
          type: 'number',
          required: true
        }
      },
      default: {
        totalLength: { '@path': '$.properties.total_length' },
        watchTime: { '@path': '$.properties.position' }
      }
    },
    sessionId: {
      label: 'Session ID',
      description: 'The ID of the session in which the user viewed the item.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.session' }
    },
    ...interactionFields('view portion')
  },
  perform: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(payloadToViewPortion(data.payload))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.map(payloadToViewPortion)))
  }
}

function payloadToViewPortion(payload: Payload): SetViewPortion {
  if (payload.portion.totalLength === 0) {
    throw new PayloadValidationError('The total length of the item cannot be zero.')
  }
  return new SetViewPortion({
    userId: payload.userId,
    itemId: payload.itemId,
    timestamp: payload.timestamp,
    portion: payload.portion.watchTime / payload.portion.totalLength,
    sessionId: payload.sessionId,
    additionalData: payload.additionalData,
    recommId: payload.recommId
  })
}

export default action
