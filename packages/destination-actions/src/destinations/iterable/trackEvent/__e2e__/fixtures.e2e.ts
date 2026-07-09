import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import trackEvent from '../index'

const fixtures: E2EFixture[] = [
  {
    description: 'Successfully tracks a purchase event',
    subscribe: 'type = "track"',
    mapping: defaultValues(trackEvent.fields),
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-test-user-001',
      properties: {
        email: 'e2e-test@segment.com',
        orderId: '$guid:orderId',
        total: 49.99
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Rejects event when both email and userId are missing',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: (() => {
      const { email, userId, ...rest } = defaultValues(trackEvent.fields)
      return rest
    })(),
    event: createE2EEvent('track', 'Button Clicked', {
      properties: {
        buttonId: 'cta-hero'
      }
    }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'Must include email or userId.'
    }
  }
]

export default fixtures
