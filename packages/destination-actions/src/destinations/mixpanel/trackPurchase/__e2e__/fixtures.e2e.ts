import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import trackPurchase from '../index'
import { FLAGS } from '../../common/utils'

// trackPurchase posts to the Mixpanel Import Events API (/import), the same flag-gated endpoint as
// trackEvent. Each fixture runs twice (project-token-auth OFF and ON) asserting the same output.
//
// generatePurchaseEventPerProduct is forced OFF in every fixture so that each input payload maps to
// exactly one Mixpanel event. This keeps the per-item MultiStatus indexes aligned 1:1 with the batch
// payload indexes (with it ON, one payload fans out into N "Product Purchased" events and the
// server-side failed_records indexes would no longer line up with payload positions).
//
// FAILURE TYPES (per request): same as trackEvent — trackPurchase's performBatch runs no per-item
// code validation, so a true "fails inside performBatch" (Type 2) cannot be manufactured. We cover
// Type 1 (missing required `event`, fails before performBatch) and a server-side strict-mode
// rejection (a FUTURE timestamp -> failed_records "must not be in the future", errorreporter
// DESTINATION; note a far-PAST timestamp is NOT rejected by Mixpanel).

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
    description: 'Successfully tracks a batch of purchases',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'batchWithMultistatus',
    features: { [MULTISTATUS]: true },
    events: [
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-test-user-mixpanel-purchase-batch-001',
        properties: { order_id: '$guid:order1', total: 19.99, currency: 'USD' }
      }),
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-test-user-mixpanel-purchase-batch-002',
        properties: { order_id: '$guid:order2', total: 29.99, currency: 'USD' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200 }, { status: 200 }]
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
        properties: { order_id: '$guid:orderMix1', total: 9.99, currency: 'USD' }
      }),
      // No event name -> required `event` missing -> fails before performBatch.
      createE2EEvent('track', undefined, {
        userId: 'e2e-test-user-mixpanel-purchase-mix-002',
        properties: { order_id: '$guid:orderMix2', total: 0, currency: 'USD' }
      }),
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-test-user-mixpanel-purchase-mix-003',
        properties: { order_id: '$guid:orderMix3', total: 14.99, currency: 'USD' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' },
        { status: 200 }
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
        properties: { order_id: '$guid:orderSrv1', total: 24.99, currency: 'USD' }
      }),
      // [1] missing event name -> Type 1 (INTEGRATIONS)
      createE2EEvent('track', undefined, {
        userId: 'e2e-test-user-mixpanel-purchase-srv-002',
        properties: { order_id: '$guid:orderSrv2', total: 0, currency: 'USD' }
      }),
      // [2] valid schema, FUTURE timestamp -> Mixpanel strict-mode server-side reject (DESTINATION)
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
        { status: 200 },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' },
        { status: 400, errorreporter: 'DESTINATION' }
      ]
    }
  }
]

const fixtures: E2EFixture[] = baseFixtures.flatMap(withAuthFlagVariants)

export default fixtures
