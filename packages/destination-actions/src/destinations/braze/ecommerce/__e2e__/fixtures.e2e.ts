import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import ecommerce from '../index'
import { EVENT_NAMES } from '../constants'

// End-to-end fixtures for the Braze multi-product "ecommerce" action. These call the real Braze
// users/track REST API (iad-01 cluster). syncMode is 'add' (via __segment_internal_sync_mode) so
// Braze creates the test profile on the fly and events land regardless of prior state.
//
// Coverage mirrors the destination presets that route to the `ecommerce` action:
//   - Order Placed (beta)      -> name: ORDER_PLACED
//   - Checkout Started (beta)  -> name: CHECKOUT_STARTED
//   - Order Refunded (beta)    -> name: ORDER_REFUNDED
//   - Order Cancelled (beta)   -> name: ORDER_CANCELLED
//   - Product Added (beta)     -> name: CART_UPDATED, action: 'add'   (STRATCONN-6824)
//   - Product Removed (beta)   -> name: CART_UPDATED, action: 'remove' (STRATCONN-6824)
// plus direct cart_updated (replace + minimal), a batch, and a client-side validation error.

const ADD_SYNC = { __segment_internal_sync_mode: 'add' }

// Base mapping: default field mappings + syncMode add. Individual fixtures override `name` and any
// event-specific fields. `name` is pinned per fixture (presets pin it to a constant, not $.event).
const baseMapping = {
  ...defaultValues(ecommerce.fields),
  ...ADD_SYNC
}

// A products array in the shape the default @arrayPath mapping reads from $.properties.products.
const products = [
  {
    product_id: 'e2e-prod-1',
    name: 'E2E Product 1',
    variant: 'Size M',
    image_url: 'https://example.com/prod1.jpg',
    url: 'https://example.com/prod1',
    quantity: 2,
    price: 25.0
  },
  {
    product_id: 'e2e-prod-2',
    name: 'E2E Product 2',
    variant: 'Size L',
    image_url: 'https://example.com/prod2.jpg',
    url: 'https://example.com/prod2',
    quantity: 1,
    price: 50.0
  }
]

const discount_items = [
  { code: 'SUMMER21', amount: 5 },
  { code: 'VIPCUSTOMER', amount: 5 }
]

const fixtures: E2EFixture[] = [
  {
    // Preset: Order Placed (beta)
    description: 'Order Placed — full order with discounts, subtotal/tax/shipping',
    subscribe: 'event = "Order Completed"',
    mapping: { ...baseMapping, name: EVENT_NAMES.ORDER_PLACED },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-braze-order-placed-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        order_id: 'e2e-order-1',
        cart_id: 'e2e-cart-1',
        total: 100.0,
        subtotal: 85.0,
        tax: 9.0,
        shipping: 6.0,
        discount: 10,
        discount_items,
        products
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    // Preset: Checkout Started (beta)
    description: 'Checkout Started — with subtotal/tax/shipping',
    subscribe: 'event = "Checkout Started"',
    mapping: { ...baseMapping, name: EVENT_NAMES.CHECKOUT_STARTED },
    mode: 'single',
    event: createE2EEvent('track', 'Checkout Started', {
      userId: 'e2e-braze-checkout-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        checkout_id: 'e2e-checkout-1',
        cart_id: 'e2e-cart-1',
        total: 100.0,
        subtotal: 85.0,
        tax: 9.0,
        shipping: 6.0,
        products
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    // Preset: Order Refunded (beta)
    description: 'Order Refunded — with discounts',
    subscribe: 'event = "Order Refunded"',
    mapping: { ...baseMapping, name: EVENT_NAMES.ORDER_REFUNDED },
    mode: 'single',
    event: createE2EEvent('track', 'Order Refunded', {
      userId: 'e2e-braze-order-refunded-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        order_id: 'e2e-order-1',
        total: 100.0,
        discount: 10,
        discount_items,
        products
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    // Preset: Order Cancelled (beta)
    description: 'Order Cancelled — with cancel reason + subtotal/tax/shipping',
    subscribe: 'event = "Order Cancelled"',
    mapping: { ...baseMapping, name: EVENT_NAMES.ORDER_CANCELLED },
    mode: 'single',
    event: createE2EEvent('track', 'Order Cancelled', {
      userId: 'e2e-braze-order-cancelled-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        order_id: 'e2e-order-1',
        reason: 'Changed my mind',
        total: 100.0,
        subtotal: 85.0,
        tax: 9.0,
        shipping: 6.0,
        discount: 10,
        discount_items,
        products
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    // Preset: Product Added (beta) -> cart_updated with action 'add' (STRATCONN-6824)
    description: 'Product Added — cart_updated action=add',
    subscribe: 'event = "Product Added"',
    mapping: { ...baseMapping, name: EVENT_NAMES.CART_UPDATED, action: 'add' },
    mode: 'single',
    event: createE2EEvent('track', 'Product Added', {
      userId: 'e2e-braze-product-added-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        cart_id: 'e2e-cart-add-1',
        total: 100.0,
        products
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    // Preset: Product Removed (beta) -> cart_updated with action 'remove' (STRATCONN-6824)
    description: 'Product Removed — cart_updated action=remove',
    subscribe: 'event = "Product Removed"',
    mapping: { ...baseMapping, name: EVENT_NAMES.CART_UPDATED, action: 'remove' },
    mode: 'single',
    event: createE2EEvent('track', 'Product Removed', {
      userId: 'e2e-braze-product-removed-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        cart_id: 'e2e-cart-remove-1',
        total: 100.0,
        products
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    // Direct cart_updated with action 'replace' + all optional cart fields.
    description: 'Cart Updated — action=replace with subtotal/tax/shipping',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      name: EVENT_NAMES.CART_UPDATED,
      action: { '@path': '$.properties.action' }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Cart Updated', {
      userId: 'e2e-braze-cart-replace-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        cart_id: 'e2e-cart-replace-1',
        action: 'replace',
        total: 100.0,
        subtotal: 85.0,
        tax: 9.0,
        shipping: 6.0,
        products
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    // Minimal cart_updated: only required fields (cart_id, total_value, products, currency, source).
    description: 'Cart Updated — minimal required fields only',
    subscribe: 'type = "track"',
    mapping: { ...baseMapping, name: EVENT_NAMES.CART_UPDATED },
    mode: 'single',
    event: createE2EEvent('track', 'Cart Updated', {
      userId: 'e2e-braze-cart-minimal-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        cart_id: 'e2e-cart-minimal-1',
        total: 42.0,
        products: [products[0]]
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    // Batch of mixed ecommerce events (all route through the same action).
    description: 'Batch — order placed + cart added + cart removed',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      name: { '@path': '$.properties.braze_event_name' },
      action: { '@path': '$.properties.action' }
    },
    mode: 'batch',
    events: [
      createE2EEvent('track', 'Order Completed', {
        userId: 'e2e-braze-batch-001',
        properties: {
          braze_event_name: EVENT_NAMES.ORDER_PLACED,
          currency: 'USD',
          source: 'e2e-test',
          order_id: 'e2e-batch-order-1',
          total: 100.0,
          products
        }
      }),
      createE2EEvent('track', 'Product Added', {
        userId: 'e2e-braze-batch-002',
        properties: {
          braze_event_name: EVENT_NAMES.CART_UPDATED,
          action: 'add',
          currency: 'USD',
          source: 'e2e-test',
          cart_id: 'e2e-batch-cart-1',
          total: 75.0,
          products
        }
      }),
      createE2EEvent('track', 'Product Removed', {
        userId: 'e2e-braze-batch-003',
        properties: {
          braze_event_name: EVENT_NAMES.CART_UPDATED,
          action: 'remove',
          currency: 'USD',
          source: 'e2e-test',
          cart_id: 'e2e-batch-cart-1',
          total: 25.0,
          products: [products[0]]
        }
      })
    ],
    expect: { status: 'success' }
  },
  {
    // Client-side validation error: no user identifier at all -> PayloadValidationError before HTTP.
    description: 'Missing all identifiers — PayloadValidationError before HTTP',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      name: EVENT_NAMES.CART_UPDATED,
      external_id: { '@path': '$.properties.does_not_exist' },
      email: { '@path': '$.properties.does_not_exist' },
      phone: { '@path': '$.properties.does_not_exist' },
      braze_id: { '@path': '$.properties.does_not_exist' }
    },
    mode: 'single',
    event: {
      type: 'track',
      event: 'Cart Updated',
      messageId: '$guid',
      timestamp: '$now',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        cart_id: 'e2e-cart-noid-1',
        total: 10.0,
        products: [products[0]]
      }
    },
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" or "phone" is required.'
    }
  }
]

export default fixtures
