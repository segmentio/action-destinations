import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { TopsortAPIClient } from '../client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'ImpressionsList',
  defaultSubscription: 'type = "track" and event = "Product List Viewed"',
  description: 'Send impression events to Topsort when a consumer has viewed a list of promotables.',
  fields: {
    messageId: {
      label: 'Message ID',
      description: 'Unique ID for the event message',
      type: 'string',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Timestamp when the event occurred',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'Anonymous identifier for the user',
      type: 'string',
      required: true,
      default: {
        '@path': '$.anonymousId'
      }
    },
    products: {
      label: 'Products',
      description: 'The list of products viewed. Each product is a promotable entity.',
      type: 'object',
      multiple: true,
      required: true,
      properties: {
        resolvedBidId: {
          label: 'Resolved Bid ID',
          description: 'The ID of the resolved bid for the product.',
          type: 'string',
          required: true
        },
        additionalAttribution: {
          label: 'Additional Attribution',
          description: 'Additional attribution information for the product.',
          type: 'object',
          required: false
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            resolvedBidId: { '@path': 'resolvedBidId' },
            additionalAttribution: { '@path': 'additionalAttribution' }
          }
        ]
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const client = new TopsortAPIClient(request, settings)
    console.log('payload', payload)
    const impressions = payload.products?.map((impression) => ({
      id: payload.messageId,
      occurredAt: payload.timestamp,
      opaqueUserId: payload.anonymousId,
      resolvedBidId: impression.resolvedBidId,
      ...(impression.additionalAttribution && {
        additionalAttribution: impression.additionalAttribution
      })
    }))

    return client.sendEvent({
      impressions
    })
  }
}

export default action
