/**
 * E2E fixtures for Braze `trackPurchase2` (`POST /users/track`, `purchases`).
 *
 * One event expands into one purchase per product, so these check the expansion count Braze
 * reports, and the batch path's own rejections: an event with no products, and one with more
 * products than Braze takes in a request (413, PAYLOAD_TOO_LARGE).
 */
import type { SegmentEvent } from '@segment/actions-core'
import type { E2EFixture } from '../../../../lib/e2e/types'
import { createE2EEvent } from '../../../../lib/e2e/helpers'
import { MAX_BATCH_SIZE } from '../../constants'

const ADD = { __segment_internal_sync_mode: 'add' }

const product = (id: string, price: number) => ({ product_id: id, price, quantity: 1, currency: 'USD' })

const order = (userId: string, products: ReturnType<typeof product>[]): SegmentEvent =>
  createE2EEvent('track', 'Order Completed', {
    userId,
    properties: { order_id: '$guid:order', products }
  })

const fixtures: E2EFixture[] = [
  {
    description: 'order with one product is recorded as one purchase',
    mode: 'single',
    subscribe: 'event = "Order Completed"',
    event: order('e2e-braze-buyer-001', [product('e2e-sku-1', 9.99)]),
    mapping: ADD,
    expect: { status: 'success', httpStatus: 201, jsonContains: { message: 'success', purchases_processed: 1 } }
  },
  {
    description: 'order with two products is recorded as two purchases',
    mode: 'single',
    subscribe: 'event = "Order Completed"',
    event: order('e2e-braze-buyer-002', [product('e2e-sku-1', 9.99), product('e2e-sku-2', 19.99)]),
    mapping: ADD,
    expect: { status: 'success', jsonContains: { purchases_processed: 2 } }
  },
  {
    description: 'batch of two orders is flattened into three purchases',
    mode: 'batchWithMultistatus',
    subscribe: 'event = "Order Completed"',
    events: [
      order('e2e-braze-buyer-003', [product('e2e-sku-1', 9.99)]),
      order('e2e-braze-buyer-004', [product('e2e-sku-2', 19.99), product('e2e-sku-3', 4.5)])
    ],
    mapping: ADD,
    expect: { status: 'success', jsonContains: { purchases_processed: 3 } }
  },
  {
    description: 'mixed batch records the order with products and rejects the empty one per event',
    mode: 'batchWithMultistatus',
    subscribe: 'event = "Order Completed"',
    events: [order('e2e-braze-buyer-005', [product('e2e-sku-1', 9.99)]), order('e2e-braze-buyer-006', [])],
    mapping: ADD,
    expect: {
      status: 'multistatus',
      items: [
        { status: '2xx' },
        // Braze sets `body` on this rejection, so core reports it as DESTINATION; not asserted.
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'did not contain any products' }
      ]
    }
  },
  {
    description: 'product with a string price fails validation before any request',
    mode: 'single',
    subscribe: 'event = "Order Completed"',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-braze-buyer-err-001',
      properties: { products: [{ product_id: 'e2e-sku-1', price: 'free' }] }
    }),
    mapping: ADD,
    expect: { status: 'error', errorType: 'PAYLOAD_VALIDATION_FAILED', httpStatus: 400 }
  },
  {
    description: 'batch of orders with no products is rejected per event without a request',
    mode: 'batchWithMultistatus',
    subscribe: 'event = "Order Completed"',
    events: [order('e2e-braze-buyer-err-002', []), order('e2e-braze-buyer-err-003', [])],
    mapping: ADD,
    expect: {
      status: 'error',
      errorType: 'PAYLOAD_VALIDATION_FAILED',
      httpStatus: 400,
      errorMessage: 'did not contain any products'
    }
  },
  {
    description: 'order with more products than Braze accepts in a request is rejected as too large',
    mode: 'batchWithMultistatus',
    subscribe: 'event = "Order Completed"',
    events: [
      order(
        'e2e-braze-buyer-err-004',
        Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, i) => product(`e2e-sku-${i}`, 1))
      )
    ],
    mapping: ADD,
    expect: {
      status: 'error',
      errorType: 'PAYLOAD_TOO_LARGE',
      httpStatus: 413,
      errorMessage: 'Max batch size exceeded'
    }
  }
]

export default fixtures
