import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import ecommerceSingleProduct from '../index'
import { EVENT_NAMES } from '../../ecommerce/constants'

// End-to-end fixtures for the Braze single-product "ecommerceSingleProduct" action. Calls the real
// Braze users/track REST API (iad-01). syncMode 'add' creates the profile so events land.
//
// Coverage mirrors the destination preset that routes here:
//   - Product Viewed (beta) -> name: PRODUCT_VIEWED
// plus catalog_type (price_drop / back_in_stock) coverage (STRATCONN-6824) and a batch.

const ADD_SYNC = { __segment_internal_sync_mode: 'add' }

const baseMapping = {
  ...defaultValues(ecommerceSingleProduct.fields),
  ...ADD_SYNC,
  name: EVENT_NAMES.PRODUCT_VIEWED
}

const fixtures: E2EFixture[] = [
  {
    // Preset: Product Viewed (beta)
    description: 'Product Viewed — single product',
    subscribe: 'event = "Product Viewed"',
    mapping: baseMapping,
    mode: 'single',
    event: createE2EEvent('track', 'Product Viewed', {
      userId: 'e2e-braze-product-viewed-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        product_id: 'e2e-prod-1',
        name: 'E2E Product 1',
        variant: 'Size M',
        image_url: 'https://example.com/prod1.jpg',
        url: 'https://example.com/prod1',
        price: 25.0
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    // Product Viewed with catalog_type trigger values (STRATCONN-6824).
    description: 'Product Viewed — with catalog_type price_drop + back_in_stock',
    subscribe: 'event = "Product Viewed"',
    mapping: {
      ...baseMapping,
      catalog_type: { '@path': '$.properties.type' }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Product Viewed', {
      userId: 'e2e-braze-product-viewed-catalog-001',
      properties: {
        currency: 'USD',
        source: 'e2e-test',
        product_id: 'e2e-prod-1',
        name: 'E2E Product 1',
        variant: 'Size M',
        image_url: 'https://example.com/prod1.jpg',
        url: 'https://example.com/prod1',
        price: 25.0,
        type: ['price_drop', 'back_in_stock']
      }
    }),
    expect: { status: 'success', bodyContains: '"message":"success"' }
  },
  {
    description: 'Batch — two product viewed events',
    subscribe: 'event = "Product Viewed"',
    mapping: baseMapping,
    mode: 'batch',
    events: [
      createE2EEvent('track', 'Product Viewed', {
        userId: 'e2e-braze-pv-batch-001',
        properties: {
          currency: 'USD',
          source: 'e2e-test',
          product_id: 'e2e-prod-1',
          name: 'E2E Product 1',
          variant: 'Size M',
          price: 25.0
        }
      }),
      createE2EEvent('track', 'Product Viewed', {
        userId: 'e2e-braze-pv-batch-002',
        properties: {
          currency: 'USD',
          source: 'e2e-test',
          product_id: 'e2e-prod-2',
          name: 'E2E Product 2',
          variant: 'Size L',
          price: 50.0
        }
      })
    ],
    expect: { status: 'success' }
  }
]

export default fixtures
