import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SetViewPortion, RecombeeApiClient, Batch } from '../recombeeApiClient'
import { interactionFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Set View Portion',
  description:
    'Sets the viewed portion of a given item (e.g. a video or article) by the given user. **Use this action when you have the viewed portion as a number between 0 and 1.**',
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
      description:
        'The viewed portion of the item as a number in the interval [0.0,1.0], where 0.0 means the user viewed nothing and 1.0 means the full item was viewed. It should be the actual viewed part of the item, no matter the seeking. For example, if the user seeked immediately to half of the item and then viewed 10% of the item, the `portion` should still be `0.1`.',
      type: 'number',
      required: true,
      default: { '@path': '$.properties.portion' }
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
    await client.send(new SetViewPortion(data.payload))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.map((event) => new SetViewPortion(event))))
  }
}

export default action
