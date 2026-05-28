import type { E2EFixture } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import trackEvent from '../index'

const fixtures: E2EFixture[] = [
  {
    description: 'Successfully tracks a purchase event',
    subscribe: 'type = "track"',
    mapping: defaultValues(trackEvent.fields),
    event: {
      type: 'track',
      event: 'Order Completed',
      userId: 'e2e-test-user-001',
      messageId: '$guid',
      timestamp: '$now',
      properties: {
        email: 'e2e-test@segment.com',
        orderId: '$guid:orderId',
        total: 49.99
      }
    },
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Rejects event when both email and userId are missing',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(trackEvent.fields),
      email: undefined,
      userId: undefined
    },
    event: {
      type: 'track',
      event: 'Button Clicked',
      messageId: '$guid',
      timestamp: '$now',
      properties: {
        buttonId: 'cta-hero'
      }
    },
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'Must include email or userId.'
    }
  }
]

export default fixtures
