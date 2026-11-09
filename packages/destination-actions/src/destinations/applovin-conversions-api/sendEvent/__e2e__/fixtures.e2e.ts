import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import sendEvent from '../index'

const ALEID = 'e2e-test-aleid'

let seq = 0
const nextUser = (): string => {
  seq += 1
  return `e2e-applovin-customer-${String(seq).padStart(3, '0')}`
}

const context = {
  ip: '203.0.113.7',
  userAgent: 'Mozilla/5.0 Segment-E2E',
  page: { url: 'https://example.com/checkout' }
}

const purchaseMapping = {
  ...defaultValues(sendEvent.fields),
  name: 'purchase',
  value: { '@path': '$.properties.subtotal' }
}

const purchase = (overrides: Record<string, unknown> = {}) =>
  createE2EEvent('track', 'Order Completed', {
    userId: nextUser(),
    anonymousId: '$guid',
    context,
    properties: {
      order_id: '$guid',
      aleid: ALEID,
      currency: 'USD',
      subtotal: 10,
      shipping: 0,
      tax: 0,
      email: 'e2e-applovin@segment.com',
      products: [{ product_id: 'sku-1', name: 'Test Shoe', price: 10, quantity: 1 }]
    },
    ...overrides
  })

const fixtures: E2EFixture[] = [
  {
    description: 'Successfully sends a purchase event',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'single',
    event: purchase(),
    expect: { status: 'success', httpStatus: 200, jsonContains: { status: 'success' } }
  },
  {
    description: 'Successfully sends a page_view event',
    subscribe: 'type = "page"',
    mapping: { ...defaultValues(sendEvent.fields), name: 'page_view' },
    mode: 'single',
    event: createE2EEvent('page', 'Home', {
      anonymousId: '$guid',
      context,
      properties: { aleid: ALEID }
    }),
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description: 'Successfully sends an app_open event from an app source',
    subscribe: 'type = "track"',
    mapping: { ...defaultValues(sendEvent.fields), name: 'app_open' },
    mode: 'single',
    event: createE2EEvent('track', 'Application Opened', {
      anonymousId: '$guid',
      context: {
        ip: '203.0.113.7',
        userAgent: 'Segment-E2E-App',
        device: { type: 'ios', id: 'e2e-idfv' },
        os: { name: 'iOS' }
      },
      properties: { aleid: ALEID }
    }),
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description: 'Successfully sends a batch of purchase events',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'batch',
    events: [purchase(), purchase(), purchase()],
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description: 'A batch with one schema-invalid and one rule-invalid event only sends the valid ones',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'batchWithMultistatus',
    events: [
      purchase(),
      purchase({ context: { userAgent: 'Segment-E2E', page: context.page } }),
      purchase({ context: { ...context, ip: 'not-an-ip' } }),
      purchase()
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' },
        { status: 400, errormessage: 'IP Address must be a valid IPv4 or IPv6 address.' },
        { status: 200 }
      ]
    }
  },
  {
    description: 'Rejects an event with no ALEID before sending',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'single',
    event: purchase({
      properties: {
        order_id: '$guid',
        currency: 'USD',
        subtotal: 10,
        shipping: 0,
        tax: 0,
        email: 'e2e-applovin@segment.com',
        products: [{ product_id: 'sku-1', price: 10, quantity: 1 }]
      }
    }),
    expect: {
      status: 'error',
      errorType: 'AggregateAjvError',
      errorMessage: "User Data is missing the required field 'aleid'."
    }
  },
  {
    description: 'Rejects an event whose only identifier is the ALEID',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'single',
    event: purchase({
      userId: undefined,
      anonymousId: undefined,
      properties: {
        order_id: '$guid',
        aleid: ALEID,
        currency: 'USD',
        subtotal: 10,
        shipping: 0,
        tax: 0,
        products: [{ product_id: 'sku-1', price: 10, quantity: 1 }]
      }
    }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage:
        'At least one identifier other than ALEID is required: alart, axwrt, client ID, user ID, email or phone.'
    }
  },
  {
    description: 'Rejects an event older than 730 days before sending',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'single',
    event: purchase({ timestamp: '2020-01-01T00:00:00.000Z' }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'Event Time cannot be more than 730 days old.'
    }
  },
  {
    description: 'Rejects an event more than 1 hour in the future before sending',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'single',
    event: purchase({ timestamp: '2099-01-01T00:00:00.000Z' }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'Event Time cannot be more than 1 hour in the future.'
    }
  },
  {
    description: 'Rejects an invalid IP address before sending',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'single',
    event: purchase({ context: { ...context, ip: '203.0.113.999' } }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'IP Address must be a valid IPv4 or IPv6 address.'
    }
  },
  {
    description: 'Successfully sends a purchase with an integer item category ID',
    subscribe: 'type = "track"',
    mapping: {
      ...purchaseMapping,
      items: {
        '@arrayPath': [
          '$.properties.products',
          {
            item_id: { '@path': '$.product_id' },
            item_name: { '@path': '$.name' },
            price: { '@path': '$.price' },
            quantity: { '@path': '$.quantity' },
            item_category_id: { '@path': '$.category_id' }
          }
        ]
      }
    },
    mode: 'single',
    event: purchase({
      properties: {
        order_id: '$guid',
        aleid: ALEID,
        currency: 'USD',
        subtotal: 10,
        shipping: 0,
        tax: 0,
        email: 'e2e-applovin@segment.com',
        products: [{ product_id: 'sku-1', name: 'Test Shoe', price: 10, quantity: 1, category_id: 1 }]
      }
    }),
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description: 'Successfully sends a purchase with plaintext email and phone that are normalized and hashed',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'single',
    event: purchase({
      properties: {
        order_id: '$guid',
        aleid: ALEID,
        currency: 'USD',
        subtotal: 10,
        shipping: 0,
        tax: 0,
        email: ' E2E.Applovin+Tag@Gmail.com ',
        phone: '+1 (415) 555-0100',
        products: [{ product_id: 'sku-1', price: 10, quantity: 1 }]
      }
    }),
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description: 'Successfully sends a purchase with every optional user_data field',
    subscribe: 'type = "track"',
    mapping: {
      ...purchaseMapping,
      user_data: {
        ...(defaultValues(sendEvent.fields).user_data as Record<string, unknown>),
        us_zip: '94107-1234',
        country_code: 'US',
        sid: 'e2e-session-1',
        ifa: 'E2E00000-0000-0000-0000-000000000001',
        idfv: 'E2E00000-0000-0000-0000-000000000002',
        os: 'iOS'
      }
    },
    mode: 'single',
    event: purchase(),
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description: 'Successfully sends a full batch of 100 purchase events',
    subscribe: 'type = "track"',
    mapping: purchaseMapping,
    mode: 'batch',
    events: Array.from({ length: 100 }, () => purchase()),
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description: 'Successfully sends a login event with no data',
    subscribe: 'type = "track"',
    mapping: { ...defaultValues(sendEvent.fields), name: 'login' },
    mode: 'single',
    event: createE2EEvent('track', 'Signed In', {
      userId: nextUser(),
      anonymousId: '$guid',
      context,
      properties: { aleid: ALEID }
    }),
    expect: { status: 'success', httpStatus: 200 }
  },
  {
    description: 'Successfully sends a sign_up event',
    subscribe: 'type = "track"',
    mapping: { ...defaultValues(sendEvent.fields), name: 'sign_up' },
    mode: 'single',
    event: createE2EEvent('track', 'Signed Up', {
      userId: nextUser(),
      anonymousId: '$guid',
      context,
      properties: { aleid: ALEID }
    }),
    expect: { status: 'success', httpStatus: 200 }
  }
]

export default fixtures
