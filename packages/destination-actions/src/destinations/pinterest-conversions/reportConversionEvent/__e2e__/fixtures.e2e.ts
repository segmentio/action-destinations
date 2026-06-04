import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import reportConversionEvent from '../index'

const fixtures: E2EFixture[] = [
  {
    description: 'Successfully sends a checkout event with order details',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-test-user-pinterest-001',
      properties: {
        email: 'e2e-test@segment.com',
        order_id: '$guid:orderId',
        value: 149.98,
        currency: 'USD'
      },
      context: {
        app: {
          name: 'E2E Test App'
        },
        ip: '203.0.113.10',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        page: {
          url: 'https://example.com/checkout'
        }
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Successfully sends a page visit event',
    subscribe: 'type = "page"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'page_visit'
    },
    mode: 'single',
    event: createE2EEvent('page', 'Home', {
      userId: 'e2e-test-user-pinterest-002',
      properties: {
        url: 'https://example.com/home'
      },
      context: {
        app: {
          name: 'E2E Test App'
        },
        ip: '203.0.113.11',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        page: {
          url: 'https://example.com/home'
        }
      },
      traits: {
        email: 'e2e-page@segment.com'
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Successfully sends an add_to_cart event with product data',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'add_to_cart'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Product Added', {
      userId: 'e2e-test-user-pinterest-003',
      properties: {
        email: 'e2e-cart@segment.com',
        price: 74.99,
        currency: 'USD',
        content_ids: ['sku-001'],
        num_items: 1
      },
      context: {
        app: {
          name: 'E2E Test App'
        },
        ip: '203.0.113.12',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Successfully sends a search event with query string',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'search'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Products Searched', {
      userId: 'e2e-test-user-pinterest-004',
      properties: {
        email: 'e2e-search@segment.com',
        query: 'summer dresses'
      },
      context: {
        app: {
          name: 'E2E Test App'
        },
        ip: '203.0.113.13',
        userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36'
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Successfully sends a signup event',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'signup'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Signed Up', {
      userId: 'e2e-test-user-pinterest-005',
      properties: {
        email: 'e2e-signup@segment.com'
      },
      context: {
        app: {
          name: 'E2E Test App'
        },
        ip: '203.0.113.14',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Rejects event when user_data is missing email, hashed_maids, and IP+UA pair',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      user_data: {}
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-test-user-pinterest-006',
      properties: {
        order_id: 'order-123'
      },
      context: {
        app: {
          name: 'E2E Test App'
        }
      }
    }),
    expect: {
      status: 'error',
      errorType: 'IntegrationError',
      errorMessage:
        'User data must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields'
    }
  },
  {
    description: 'Rejects event with invalid event_name not in choices list',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'invalid_event_name'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Some Event', {
      userId: 'e2e-test-user-pinterest-007',
      properties: {
        email: 'e2e-invalid@segment.com'
      },
      context: {
        app: {
          name: 'E2E Test App'
        },
        ip: '203.0.113.15',
        userAgent: 'Mozilla/5.0'
      }
    }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError'
    }
  },
  {
    description: 'Rejects event with invalid action_source not in choices list',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      action_source: 'invalid_source'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-test-user-pinterest-008',
      properties: {
        email: 'e2e-invalid-source@segment.com'
      },
      context: {
        app: {
          name: 'E2E Test App'
        },
        ip: '203.0.113.16',
        userAgent: 'Mozilla/5.0'
      }
    }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError'
    }
  },
  {
    description: 'Pinterest rejects event with timestamp too far in the past',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      event_time: '2020-01-01T00:00:00.000Z'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-test-user-pinterest-009',
      properties: {
        email: 'e2e-old-event@segment.com'
      },
      context: {
        app: {
          name: 'E2E Test App'
        },
        ip: '203.0.113.17',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }),
    expect: {
      status: 'failure',
      httpStatus: 400
    },
    verboseFailureHint: 'Pinterest rejects events with event_time older than 7 days.'
  }
]

export default fixtures
