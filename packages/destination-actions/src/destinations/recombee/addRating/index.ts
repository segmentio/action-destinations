import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AddRating, Batch, RecombeeApiClient } from '../recombeeApiClient'
import { interactionFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Rating',
  description: 'Adds a rating of the given item made by the given user.',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The ID of the user who submitted the rating.',
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
      description: 'The rated item.',
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
      description: 'The UTC timestamp of when the rating occurred.',
      type: 'string',
      required: false,
      default: { '@path': '$.timestamp' }
    },
    rating: {
      label: 'Rating',
      description:
        'The rating of the item rescaled to interval [-1.0,1.0], where -1.0 means the worst rating possible, 0.0 means neutral, and 1.0 means absolutely positive rating. For example, in the case of 5-star evaluations, rating = (numStars-3)/2 formula may be used for the conversion.',
      type: 'number',
      required: true,
      default: { '@path': '$.properties.rating' }
    },
    ...interactionFields('rating')
  },
  perform: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new AddRating(data.payload))
  },
  performBatch: async (request, data) => {
    const client = new RecombeeApiClient(data.settings, request)
    await client.send(new Batch(data.payload.map((payload) => new AddRating(payload))))
  }
}

export default action
