import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import trackPurchase from '../index'
import { FLAGS } from '../../common/utils'

// trackPurchase posts to the Mixpanel Import Events API (/import), the same flag-gated endpoint as
// trackEvent. Each fixture runs twice (project-token-auth OFF and ON) asserting the same output.
//
// generatePurchaseEventPerProduct is forced OFF in most fixtures so that each input payload maps to
// exactly one Mixpanel event. This keeps the per-item MultiStatus indexes aligned 1:1 with the batch
// payload indexes (with it ON, one payload fans out into N "Product Purchased" events and the
// server-side failed_records indexes would no longer line up with payload positions). One dedicated
// fixture exercises the ON (fan-out) path and asserts the resulting "Product Purchased" events.
//
// For batch fixtures we assert the full per-item MultiStatus response: each item's `status`, `body`,
// and the transformed `sent` payload. Note trackPurchase's `sent` is an ARRAY of Mixpanel events
// (the Order Completed event, plus any per-product events), unlike trackEvent where it is a single
// object. On success Mixpanel's import API returns body "OK".
//
// FAILURE TYPES (per request): same as trackEvent — trackPurchase's performBatch runs no per-item
// code validation, so a true "fails inside performBatch" (Type 2) cannot be manufactured. We cover
// Type 1 (missing required `event`, fails before performBatch) and a server-side strict-mode
// rejection (a FUTURE timestamp -> failed_records "must not be in the future", errorreporter
// DESTINATION; note a far-PAST timestamp is NOT rejected by Mixpanel).
//
// FIELD COVERAGE: the "all fields" fixture populates every input field of the action (including all
// top-level purchase fields and every product sub-field) so each is exercised in a successful single
// request. It asserts success only; per-field `sent` assertions live in the batch/multistatus fixtures.

const MULTISTATUS = 'mixpanel-multistatus'

const purchaseMapping = {
  ...defaultValues(trackPurchase.fields),
  generatePurchaseEventPerProduct: false
}

function withAuthFlagVariants(fixture: E2EFixture): E2EFixture[] {
  const off: E2EFixture = {
    ...fixture,
    description: `${fixture.description} (project-token-auth OFF)`
  }
  const on: E2EFixture = {
    ...fixture,
    description: `${fixture.description} (project-token-auth ON)`,
    features: { ...(fixture.features ?? {}), [FLAGS.PROJECT_TOKEN_AUTH]: true }
  }
  return [off, on]
}

// Fully-populated Order Completed event exercising every trackPurchase input field, including all
// top-level purchase fields and every product sub-field. messageId/timestamp are dynamic ($guid/$now)
// like a real event.
const ALL_FIELDS_EVENT = {
  type: 'track' as const,
  event: 'Order Completed',
  messageId: '$guid',
  timestamp: '$now',
  userId: 'e2e-user-purchase-allfields-001',
  anonymousId: 'e2e-anon-purchase-allfields-001',
  properties: {
    order_id: 'E2E-ORDER-ALLFIELDS-001',
    affiliation: 'E2E Store',
    subtotal: 40.0,
    total: 49.98,
    revenue: 49.98,
    shipping: 5.0,
    tax: 4.0,
    discount: 2.0,
    coupon: 'SAVE10',
    currency: 'USD',
    order_number: 'ON-001',
    products: [
      {
        product_id: 'SKU-1',
        sku: 'SKU-1',
        category: 'Tools',
        name: 'Widget',
        brand: 'Acme',
        variant: 'Blue',
        price: 19.99,
        quantity: 2,
        coupon: 'PROD10',
        position: 1,
        url: 'https://example.com/products/widget',
        image_url: 'https://example.com/products/widget.jpg'
      }
    ]
  },
  context: {
    ip: '203.0.113.5',
    library: { name: 'analytics.js', version: '2.0.0' }
  }
}

const baseFixtures: E2EFixture[] = [
  {
    description: 'Successfully tracks a single Order Completed purchase',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-test-user-mixpanel-purchase-001',
      properties: {
        order_id: '$guid:orderId',
        total: 49.99,
        currency: 'USD',
        products: [{ product_id: 'sku-001', price: 49.99, quantity: 1, name: 'Widget' }]
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    // Field coverage: every input field is populated so each is exercised in a successful request.
    description: 'Successfully tracks an Order Completed exercising all fields',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'single',
    event: ALL_FIELDS_EVENT,
    expect: {
      status: 'success'
    }
  },
  {
    // Fan-out path: generatePurchaseEventPerProduct ON emits one "Order Completed" plus one
    // "Product Purchased" event per product, all under a single payload's `sent` array.
    description: 'Successfully tracks a purchase with per-product events (generatePurchaseEventPerProduct)',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(trackPurchase.fields),
      generatePurchaseEventPerProduct: true
    },
    mode: 'batchWithMultistatus',
    features: { [MULTISTATUS]: true },
    events: [
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-user-purchase-fanout-001',
        properties: {
          order_id: 'E2E-ORDER-FANOUT-001',
          total: 49.98,
          currency: 'USD',
          products: [
            { product_id: 'SKU-1', name: 'Widget', price: 19.99, quantity: 1 },
            { product_id: 'SKU-2', name: 'Gadget', price: 29.99, quantity: 1 }
          ]
        }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          body: 'OK',
          sent: [
            { event: 'Order Completed', properties: { order_id: 'E2E-ORDER-FANOUT-001', total: 49.98 } },
            { event: 'Product Purchased', properties: { product_id: 'SKU-1', name: 'Widget', price: 19.99 } },
            { event: 'Product Purchased', properties: { product_id: 'SKU-2', name: 'Gadget', price: 29.99 } }
          ]
        }
      ]
    }
  },
  {
    description: 'Successfully tracks a batch of purchases',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'batchWithMultistatus',
    features: { [MULTISTATUS]: true },
    events: [
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-test-user-mixpanel-purchase-batch-001',
        properties: { order_id: 'E2E-ORDER-BATCH-001', total: 19.99, currency: 'USD' }
      }),
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-test-user-mixpanel-purchase-batch-002',
        properties: { order_id: 'E2E-ORDER-BATCH-002', total: 29.99, currency: 'USD' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          body: 'OK',
          sent: [
            {
              event: 'Order Completed',
              properties: {
                distinct_id: 'e2e-test-user-mixpanel-purchase-batch-001',
                order_id: 'E2E-ORDER-BATCH-001',
                total: 19.99,
                currency: 'USD'
              }
            }
          ]
        },
        {
          status: 200,
          body: 'OK',
          sent: [
            {
              event: 'Order Completed',
              properties: {
                distinct_id: 'e2e-test-user-mixpanel-purchase-batch-002',
                order_id: 'E2E-ORDER-BATCH-002',
                total: 29.99,
                currency: 'USD'
              }
            }
          ]
        }
      ]
    }
  },
  {
    // Type 1 only: a pre-performBatch validation failure (missing `event`) alongside successes.
    description: 'Batch with a pre-performBatch validation failure (missing event) and successes',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'batchWithMultistatus',
    features: { [MULTISTATUS]: true },
    events: [
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-test-user-mixpanel-purchase-mix-001',
        properties: { order_id: 'E2E-ORDER-MIX-001', total: 9.99, currency: 'USD' }
      }),
      // No event name -> required `event` missing -> fails before performBatch.
      createE2EEvent('track', undefined, {
        userId: 'e2e-test-user-mixpanel-purchase-mix-002',
        properties: { order_id: '$guid:orderMix2', total: 0, currency: 'USD' }
      }),
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-test-user-mixpanel-purchase-mix-003',
        properties: { order_id: 'E2E-ORDER-MIX-003', total: 14.99, currency: 'USD' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          body: 'OK',
          sent: [
            {
              event: 'Order Completed',
              properties: { order_id: 'E2E-ORDER-MIX-001', total: 9.99 }
            }
          ]
        },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' },
        {
          status: 200,
          body: 'OK',
          sent: [
            {
              event: 'Order Completed',
              properties: { order_id: 'E2E-ORDER-MIX-003', total: 14.99 }
            }
          ]
        }
      ]
    }
  },
  {
    // Comprehensive mixed batch (requirement 3, mirroring 2a): pre-validation failure +
    // server-side strict-mode rejection + success.
    description: 'Mixed batch: pre-validation failure + server-side reject + success',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'batchWithMultistatus',
    features: { [MULTISTATUS]: true },
    events: [
      // [0] valid -> delivered
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-test-user-mixpanel-purchase-srv-001',
        properties: { order_id: 'E2E-ORDER-SRV-001', total: 24.99, currency: 'USD' }
      }),
      // [1] missing event name -> Type 1 (INTEGRATIONS)
      createE2EEvent('track', undefined, {
        userId: 'e2e-test-user-mixpanel-purchase-srv-002',
        properties: { order_id: '$guid:orderSrv2', total: 0, currency: 'USD' }
      }),
      // [2] valid schema, fixed FUTURE timestamp (the invalid value under test; messageId stays
      //     dynamic) -> Mixpanel strict-mode server-side reject (DESTINATION)
      {
        ...createE2EEvent('track', 'Order Completed', {
          userId: 'e2e-test-user-mixpanel-purchase-srv-003',
          properties: { order_id: '$guid:orderSrv3', total: 39.99, currency: 'USD' }
        }),
        timestamp: '2100-01-01T00:00:00.000Z'
      }
    ],
    verboseFailureHint:
      'Index 2 expects a Mixpanel strict-mode server-side rejection (errorreporter DESTINATION) for the future (year-2100) timestamp ("must not be in the future").',
    expect: {
      status: 'success',
      jsonContains: [
        {
          // When ANY record in the batch fails strict mode, Mixpanel returns a top-level
          // code 400 / status "Bad Request", and the action stamps that status onto the
          // surviving success items' body (so it is "Bad Request" here, not "OK").
          status: 200,
          body: 'Bad Request',
          sent: [
            {
              event: 'Order Completed',
              properties: { order_id: 'E2E-ORDER-SRV-001', total: 24.99 }
            }
          ]
        },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' },
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION',
          errormessage: "'properties.time' is invalid: must not be in the future",
          body: {
            field: 'properties.time',
            message: "'properties.time' is invalid: must not be in the future"
          }
        }
      ]
    }
  }
]

const fixtures: E2EFixture[] = baseFixtures.flatMap(withAuthFlagVariants)

export default fixtures
