import type { E2EFixture, JSONObject } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import standardEvent from '../index'
import { LEGACY_API_VERSION, LATEST_API_VERSION } from '../../versioning-info'

// standardEvent is exercised on BOTH Reddit CAPI versions - api_version is a per-mapping field,
// not a Flagon flag, so every scenario below pins it explicitly (except the "omitted" fixture,
// which deliberately does NOT set it, to prove existing pre-migration customers stay on V2).
//
//   V2 group: single success, batch success (plain response - v2 has no MultiStatusResponse), and
//     the "api_version omitted" backward-compatibility fixture.
//   V3 group: single success (action_source + event_source_url + products.quantity/item_price),
//     a mixed batchWithMultistatus (one valid event, one that fails Reddit-side validation inside
//     performBatch because it's missing products.id), and the client-side error case where V3 is
//     selected without the now-conditionally-required action_source.

let userSeq = 0
function nextUser(): string {
  userSeq += 1
  return `e2e-test-user-reddit-${String(userSeq).padStart(3, '0')}`
}

const fixtures: E2EFixture[] = [
  // --- V2 -------------------------------------------------------------------------------------
  {
    description: 'V2: successfully sends a Purchase event',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(standardEvent.fields),
      api_version: LEGACY_API_VERSION,
      tracking_type: 'Purchase'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: {
        email: 'e2e-reddit-v2@segment.com',
        revenue: 49.99,
        currency: 'USD',
        products: [{ product_id: 'sku-001', category: 'Shoes', name: 'Running Shoes' }]
      }
    }),
    // Per Reddit's v2 API docs, a successful call returns 200 with { message: "string" } - a flat
    // envelope, unlike v3's { data: { message } }. The doc only shows a generic placeholder value
    // for message, so we can't assert its contents, just the status code.
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description: 'V2: successfully sends a batch of Add to Cart events (plain response, no MultiStatusResponse)',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(standardEvent.fields),
      api_version: LEGACY_API_VERSION,
      tracking_type: 'AddToCart'
    },
    mode: 'batch',
    events: [
      createE2EEvent('track', 'Product Added', {
        userId: nextUser(),
        properties: {
          email: 'e2e-reddit-v2-batch-1@segment.com',
          products: [{ product_id: 'sku-002', category: 'Shoes', name: 'Trail Runners', price: 19.99 }]
        }
      }),
      createE2EEvent('track', 'Product Added', {
        userId: nextUser(),
        properties: {
          email: 'e2e-reddit-v2-batch-2@segment.com',
          products: [{ product_id: 'sku-003', category: 'Shoes', name: 'Hiking Boots', price: 9.99 }]
        }
      })
    ],
    // Same v2 envelope caveat as above - { message } only, contents not asserted.
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description:
      'V2: mapping never sets api_version (pre-migration customer) - still resolves to V2 and succeeds',
    subscribe: 'type = "track"',
    mapping: (() => {
      const mapping: JSONObject = { ...defaultValues(standardEvent.fields), tracking_type: 'PageVisit' }
      delete mapping.api_version
      return mapping
    })(),
    mode: 'single',
    event: createE2EEvent('track', 'PageVisit', {
      userId: nextUser(),
      properties: { email: 'e2e-reddit-legacy@segment.com' }
    }),
    // Same v2 envelope caveat as above - { message } only, contents not asserted.
    expect: { status: 'success', httpStatus: 200 },
    verboseFailureHint:
      'Proves the migration safety net: a mapping saved before api_version existed has no value for it, which must resolve to LEGACY_API_VERSION (V2) at runtime, not V3.'
  },

  // --- V3 -------------------------------------------------------------------------------------
  {
    description: 'V3: successfully sends a Purchase event with action_source, event_source_url, and product pricing',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(standardEvent.fields),
      api_version: LATEST_API_VERSION,
      tracking_type: 'Purchase',
      action_source: 'WEBSITE',
      event_source_url: 'https://example.com/checkout'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: {
        email: 'e2e-reddit-v3@segment.com',
        revenue: 89.5,
        currency: 'USD',
        products: [{ product_id: 'sku-010', category: 'Shoes', name: 'Trail Runners', quantity: 2, price: 44.75 }]
      },
      context: { page: { url: 'https://example.com/checkout' } }
    }),
    // Per Reddit's v3 API docs, a successful call returns 200 with { data: { message: "Successfully
    // processed N conversion events." } } - asserting on the fixed prefix rather than the full string
    // since the event count/grammar in the message varies by request.
    expect: { status: 'success', httpStatus: 200, bodyContains: 'Successfully processed' }
  },
  {
    description:
      'V3: batch with one valid event and one that fails Reddit-side validation (missing products.id) - MultiStatusResponse reports per-item results',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(standardEvent.fields),
      api_version: LATEST_API_VERSION,
      tracking_type: 'AddToCart',
      action_source: 'WEBSITE'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2EEvent('track', 'Product Added', {
        userId: nextUser(),
        properties: {
          email: 'e2e-reddit-v3-batch-valid@segment.com',
          products: [{ product_id: 'sku-011', category: 'Shoes', name: 'Trail Runners', price: 15.0 }]
        }
      }),
      createE2EEvent('track', 'Product Added', {
        userId: nextUser(),
        properties: {
          email: 'e2e-reddit-v3-batch-invalid@segment.com',
          // The product entry has no product_id - products.id is required by our own performBatch
          // validation on V3, even though the field itself is not schema-required, so this fails
          // inside performBatch rather than at Segment's schema-validation layer.
          products: [{ category: 'Shoes', name: 'Trail Runners' }]
        }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        { status: 400, errormessage: 'products.id is required when sending to Reddit Conversions API v3' }
      ]
    }
  },
  {
    description: 'V3: rejects the mapping when action_source is not set (conditionally required only for V3)',
    subscribe: 'type = "track"',
    mapping: (() => {
      const mapping: JSONObject ={
        ...defaultValues(standardEvent.fields),
        api_version: LATEST_API_VERSION,
        tracking_type: 'Purchase'
      }
      delete mapping.action_source
      return mapping
    })(),
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { email: 'e2e-reddit-v3-missing-action-source@segment.com', revenue: 10 }
    }),
    expect: {
      status: 'error',
      errorType: 'AggregateAjvError'
    },
    verboseFailureHint:
      'action_source is required only when api_version = v3 (a conditional AJV "then" schema). If the errorType here does not match on first run, check the real thrown error name and adjust - this is a schema-validation failure thrown before performBatch/perform is ever called.'
  }
]

export default fixtures
