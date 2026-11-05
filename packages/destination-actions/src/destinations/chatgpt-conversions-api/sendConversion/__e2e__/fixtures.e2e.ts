import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import Destination from '../../index'
import sendConversion from '../index'

const baseMapping = defaultValues(sendConversion.fields)

const richProperties = {
  currency: 'USD',
  total: 25.99,
  revenue: 25.99,
  value: 25.99,
  price: 25.99,
  plan_id: 'e2e-plan',
  product_id: 'e2e-sku-1',
  category_id: 'e2e-cat-1',
  name: 'E2E Shirt',
  quantity: 1,
  oppref: 'e2e-oppref',
  products: [
    { product_id: 'e2e-sku-1', category_id: 'e2e-cat-1', name: 'E2E Shirt', quantity: 1, price: 10.0 },
    { product_id: 'e2e-sku-2', category_id: 'e2e-cat-2', name: 'E2E Hat', quantity: 2, price: 7.99 }
  ]
}

const richContext = {
  page: { url: 'https://example.com/e2e' },
  ip: '203.0.113.9',
  userAgent: 'Mozilla/5.0 (E2E)',
  device: { advertisingId: '11111111-2222-3333-4444-555555555555' },
  traits: {
    email: 'e2e-test@segment.com',
    phone: '+1 415 555 0100',
    firstName: 'Jane',
    lastName: 'Doe',
    address: { city: 'Austin', state: 'Texas', country: 'US', postalCode: '78701' }
  }
}

const richEvent = (type: 'track' | 'page', name: string) =>
  createE2EEvent(type, name, {
    userId: 'e2e-chatgpt-conversions-api-user-001',
    anonymousId: 'e2e-anon-001',
    properties: richProperties,
    context: richContext
  })

const presetFixtures: E2EFixture[] = (Destination.presets ?? []).map((preset) => {
  const { subscribe, mapping } = preset as unknown as { subscribe: string; mapping: Record<string, never> }
  const eventName = /event = "([^"]+)"/.exec(subscribe)?.[1] ?? 'Page'
  const type = subscribe.includes('type = "page"') ? 'page' : 'track'
  return {
    description: `Preset ${preset.name} sends a valid event`,
    subscribe,
    mapping,
    mode: 'single',
    event: richEvent(type, eventName),
    expect: { status: 'success' }
  }
})

const orderCompleted = {
  subscribe: 'type = "track" AND event = "Order Completed"',
  mapping: { ...baseMapping, event_type: 'order_created', amount: { '@path': '$.properties.total' } }
}

const orderCompletedEvent = (propertyOverrides: Record<string, unknown> = {}) =>
  createE2EEvent('track', 'Order Completed', {
    userId: 'e2e-chatgpt-conversions-api-user-001',
    anonymousId: 'e2e-anon-001',
    properties: { ...richProperties, ...propertyOverrides },
    context: richContext
  })

const withItemCurrency = (currency: string) => ({
  products: richProperties.products.map((product) => ({ ...product, currency }))
})

const validEvent = () => orderCompletedEvent(withItemCurrency('USD'))
const unknownCurrencyEvent = () => orderCompletedEvent({ ...withItemCurrency('USD'), currency: 'XYZ' })
const unknownItemCurrencyEvent = () => orderCompletedEvent(withItemCurrency('XYZ'))
const staleTimestampEvent = () => ({ ...validEvent(), timestamp: '2020-01-01T00:00:00.000Z' })
const noIdentifierEvent = () =>
  createE2EEvent('track', 'Order Completed', {
    properties: richProperties,
    context: { page: { url: 'https://example.com/e2e' } }
  })

const orderCompletedWithItemCurrency = {
  subscribe: orderCompleted.subscribe,
  mapping: {
    ...orderCompleted.mapping,
    contents: {
      '@arrayPath': [
        '$.properties.products',
        {
          id: { '@path': '$.product_id' },
          quantity: { '@path': '$.quantity' },
          amount: { '@path': '$.price' },
          currency: { '@path': '$.currency' }
        }
      ]
    }
  }
}

const failedBeforeSending = { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' }
const invalidCurrency = {
  status: 400,
  errortype: 'PAYLOAD_VALIDATION_FAILED',
  errormessage: 'Currency "XYZ" is not a valid ISO 4217 currency code.'
}
const delivered = { status: 200 }

const fixtures: E2EFixture[] = [
  ...presetFixtures,
  {
    description: 'Custom event sends a valid event',
    subscribe: 'type = "track" AND event = "Webinar Attended"',
    mapping: {
      ...baseMapping,
      event_type: 'custom',
      custom_event_name: 'webinar_attended',
      amount: { '@path': '$.properties.total' }
    },
    mode: 'single',
    event: richEvent('track', 'Webinar Attended'),
    expect: { status: 'success' }
  },
  {
    description: 'Server-side event with no page URL defaults to action source other',
    ...orderCompleted,
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-chatgpt-conversions-api-user-002',
      properties: { total: 10, currency: 'USD' },
      context: { traits: { email: 'e2e-test@segment.com' } }
    }),
    expect: { status: 'success' }
  },
  {
    description: 'Rejects an event with no valid identifier before sending',
    ...orderCompleted,
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      properties: { total: 10, currency: 'USD' },
      context: { page: { url: 'https://example.com/e2e' } }
    }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'At least one valid essential identifier is required: Email, Phone or Android Advertising ID.',
      httpStatus: 400
    }
  },
  {
    description: 'Batch of valid events succeeds',
    ...orderCompleted,
    mode: 'batch',
    events: [richEvent('track', 'Order Completed'), richEvent('track', 'Order Completed')],
    expect: { status: 'success' }
  },
  {
    description: 'Batch multistatus mixes valid events with pre-send validation failures',
    ...orderCompleted,
    mode: 'batchWithMultistatus',
    events: [
      richEvent('track', 'Order Completed'),
      {
        ...createE2EEvent('track', 'Order Completed', { properties: richProperties, context: richContext }),
        timestamp: '2020-01-01T00:00:00.000Z'
      },
      richEvent('track', 'Order Completed'),
      createE2EEvent('track', 'Order Completed', {
        properties: richProperties,
        context: { page: { url: 'https://example.com/e2e' } }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' },
        { status: 200 },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' }
      ]
    }
  },
  {
    description: 'Invalid currency in a batch fails before sending and the other events are delivered',
    ...orderCompleted,
    mode: 'batchWithMultistatus',
    events: [validEvent(), unknownCurrencyEvent(), validEvent(), validEvent()],
    expect: {
      status: 'success',
      jsonContains: [delivered, invalidCurrency, delivered, delivered]
    }
  },
  {
    description: 'Several kinds of pre-send failure in one batch land on the right events',
    ...orderCompleted,
    mode: 'batchWithMultistatus',
    events: [
      staleTimestampEvent(),
      validEvent(),
      validEvent(),
      unknownCurrencyEvent(),
      noIdentifierEvent(),
      validEvent()
    ],
    expect: {
      status: 'success',
      jsonContains: [failedBeforeSending, delivered, delivered, invalidCurrency, failedBeforeSending, delivered]
    }
  },
  {
    description: 'Two invalid currencies in a batch both fail before sending and the others are delivered',
    ...orderCompleted,
    mode: 'batchWithMultistatus',
    events: [validEvent(), unknownCurrencyEvent(), validEvent(), unknownCurrencyEvent()],
    expect: {
      status: 'success',
      jsonContains: [delivered, invalidCurrency, delivered, invalidCurrency]
    }
  },
  {
    description: 'Invalid currency inside a product fails only that event',
    ...orderCompletedWithItemCurrency,
    mode: 'batchWithMultistatus',
    events: [validEvent(), validEvent(), unknownItemCurrencyEvent(), validEvent()],
    expect: {
      status: 'success',
      jsonContains: [delivered, delivered, invalidCurrency, delivered]
    }
  }
]

export default fixtures
