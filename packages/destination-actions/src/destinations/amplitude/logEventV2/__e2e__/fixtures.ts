import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import logEventV2 from '../index'

const fixtures: E2EFixture[] = [
  {
    description: 'Successfully logs a track event',
    subscribe: 'type = "track"',
    mapping: defaultValues(logEventV2.fields),
    mode: 'single',
    event: createE2EEvent('track', 'Button Clicked', {
      userId: 'e2e-test-user-amplitude-001',
      properties: {
        buttonId: 'cta-signup',
        page: '/pricing'
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Successfully logs event with products array',
    subscribe: 'type = "track"',
    mapping: defaultValues(logEventV2.fields),
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-test-user-amplitude-001',
      properties: {
        revenue: 99.98,
        products: [
          { price: 49.99, quantity: 1, productId: 'prod-001', name: 'Widget' },
          { price: 49.99, quantity: 1, productId: 'prod-002', name: 'Gadget' }
        ]
      }
    }),
    expect: {
      status: 'success'
    }
  }
]

export default fixtures
