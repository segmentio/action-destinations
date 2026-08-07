import type { E2EFixture, JSONObject } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import reportConversionEvent from '../index'

// Pinterest Conversions API (/ad_accounts/{id}/events) is exercised by reportConversionEvent in
// `single` mode (the action has no performBatch). In single mode the runner asserts against
// Pinterest's HTTP RESPONSE, not the transformed outbound payload, so success fixtures assert
// `status: 'success'` (Pinterest returns 200 with a per-event num_events_received count).
//
// COVERAGE STRATEGY
//   1. EVENTS: one success fixture per event_name (all 22 choices) so every event type is proven
//      accepted by Pinterest end-to-end. Built via eventFixture() to stay DRY.
//   2. FIELDS: fields are distributed across those event fixtures (not every event carries every
//      field). App-family events carry app_info; ecommerce events carry custom_data_2 + contents;
//      one event carries a fully-populated device_info; advertiser_tracking_enabled, opt_out,
//      event_source_url, wifi, language, and the custom_data_2 top-level fields each appear in at
//      least one fixture. Latest mode is the default (data_format defaults to 'latest').
//   3. LEGACY: a couple of legacy-mode fixtures exercise the nested custom_data object and the flat
//      app_*/device_* fields, plus the undefined-data_format (existing-subscription) path.
//   4. INVALID PAYLOADS: client-side validation failures (thrown before any HTTP request) — bad
//      enum choices (AggregateAjvError), over-length strings (AggregateAjvError), invalid languages
//      (PayloadValidationError), and missing user identifiers (IntegrationError).
//   5. SERVER FAILURE: an event older than Pinterest's 7-day window (HTTP 422).
//
// PROVABILITY NOTE: number->string coercions (value, predicted_ltv, item_price) and the
// install_time ISO->unix conversion are asserted in the unit tests, which can inspect the outbound
// body. Here they are only proven "accepted" — a wrong install_time TYPE would make Pinterest 400,
// so the app_install success fixture doubles as an acceptance check for that conversion.

const LATEST_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'

let userSeq = 0
function nextUser(): string {
  userSeq += 1
  return `e2e-test-user-pinterest-${String(userSeq).padStart(3, '0')}`
}

// A minimal, always-valid latest-mode success fixture for a given event_name. Callers can extend
// the event's properties/context/traits and override mapping fields to layer on field coverage.
function eventFixture(
  eventName: string,
  opts: {
    description?: string
    properties?: JSONObject
    context?: JSONObject
    traits?: JSONObject
    mapping?: JSONObject
    type?: 'track' | 'page'
    eventTitle?: string
  } = {}
): E2EFixture {
  const type = opts.type ?? 'track'
  return {
    description: opts.description ?? `Successfully sends a ${eventName} event`,
    subscribe: `type = "${type}"`,
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: eventName,
      ...opts.mapping
    },
    mode: 'single',
    event: createE2EEvent(type, opts.eventTitle ?? eventName, {
      userId: nextUser(),
      properties: {
        email: `e2e-${eventName}@segment.com`,
        ...opts.properties
      },
      context: {
        app: { name: 'E2E Test App' },
        ip: '203.0.113.10',
        userAgent: LATEST_UA,
        ...opts.context
      },
      ...(opts.traits ? { traits: opts.traits } : {})
    }),
    expect: {
      status: 'success'
    }
  }
}

// --- 22 event success fixtures, with field coverage distributed across them ---
const eventFixtures: E2EFixture[] = [
  // Ecommerce / value + contents + custom_data_2 top-level fields
  eventFixture('checkout', {
    eventTitle: 'Order Completed',
    properties: {
      order_id: '$guid:orderId',
      value: 149.98,
      currency: 'USD',
      products: [
        {
          product_id: 'sku-checkout-1',
          price: 74.99,
          quantity: 2,
          brand: 'Brand A',
          category: 'Shoes',
          name: 'Running Shoe'
        }
      ]
    },
    context: { page: { url: 'https://example.com/checkout' } }
  }),
  eventFixture('add_payment_info', {
    properties: { value: 42.5, currency: 'USD' }
  }),
  eventFixture('add_to_cart', {
    eventTitle: 'Product Added',
    properties: {
      price: 74.99,
      currency: 'USD',
      content_ids: ['sku-001'],
      num_items: 1
    }
  }),
  eventFixture('add_to_wishlist', {
    properties: { content_ids: ['sku-wishlist-1'], currency: 'USD' }
  }),
  eventFixture('initiate_checkout', {
    properties: { value: 99.0, currency: 'USD', num_items: 3 }
  }),
  eventFixture('customize_product', {
    // custom_data_2 top-level content fields
    mapping: {
      custom_data_2: {
        content_brand: 'pinterest-brand',
        content_category: 'shirts',
        content_name: 'pinterest-themed-clothing',
        predicted_ltv: 2794.82
      }
    }
  }),
  // contents item_* field coverage on a view event
  eventFixture('view_content', {
    eventTitle: 'Product Viewed',
    mapping: {
      contents: [
        {
          id: 'sku-view-1',
          item_price: 19.99,
          quantity: 1,
          item_brand: 'pinterest',
          item_brand_id: 'brand-64',
          item_category: 'pinterest-clothing-shirts',
          item_name: 'pinterest-shirt-girl'
        }
      ]
    }
  }),
  eventFixture('view_category', {
    properties: { category: 'Shoes' }
  }),
  // search_string coverage
  eventFixture('search', {
    eventTitle: 'Products Searched',
    properties: { query: 'summer dresses' }
  }),
  // App-family events carry app_info (install_time conversion proven accepted on app_install)
  eventFixture('app_install', {
    context: { app: { name: 'E2E Test App', namespace: 'com.e2e.app', version: '7.9' } },
    mapping: {
      app_info: {
        app_id: '429047995',
        app_name: 'MyAwesomeApp',
        app_package_name: 'com.company.myawesomeapp',
        app_store: 'Google Play Store',
        app_version: '7.9',
        install_time: '2025-02-10T18:17:49.000Z',
        window_height: 900,
        window_width: 1678
      }
    }
  }),
  eventFixture('app_open', {
    mapping: {
      app_info: { app_id: '429047995', app_name: 'MyAwesomeApp' }
    }
  }),
  // Fully-populated device_info (enums + languages) on a content event
  eventFixture('watch_video', {
    mapping: {
      device_info: {
        battery_level: 78,
        brand: 'Apple',
        carrier: 'T-Mobile',
        cpu_cores: 8,
        form_factor: 'cellphone',
        languages: ['en', 'fr'],
        locale: 'en-us',
        model: '16 Pro',
        network_type: 'wifi',
        os_family: 'ios',
        os_name: 'iOS',
        os_release_name: 'Dawn',
        os_version: '18.3',
        screen_density: 460,
        screen_height: 2868,
        screen_width: 1320,
        timezone: 'America/Los_Angeles',
        timezone_abbr: 'PDT',
        type: 'iPhone'
      }
    }
  }),
  // Lead / contact / scheduling family
  eventFixture('lead', {
    properties: { value: 10.0, currency: 'USD' }
  }),
  eventFixture('contact'),
  eventFixture('schedule'),
  eventFixture('find_location'),
  eventFixture('submit_application'),
  // Subscription / trial family — predicted_ltv + advertiser_tracking_enabled coverage
  eventFixture('start_trial', {
    mapping: {
      advertiser_tracking_enabled: true,
      custom_data_2: { predicted_ltv: 500.5, currency: 'USD' }
    }
  }),
  eventFixture('subscribe', {
    mapping: { advertiser_tracking_enabled: false }
  }),
  // signup — opt_out coverage
  eventFixture('signup', {
    eventTitle: 'Signed Up',
    mapping: { opt_out: false }
  }),
  // custom event
  eventFixture('custom', {
    eventTitle: 'Custom Event',
    properties: { value: 5.0, currency: 'USD' }
  }),
  // page_visit via a page event — event_source_url + wifi + language coverage
  eventFixture('page_visit', {
    type: 'page',
    eventTitle: 'Home',
    properties: { url: 'https://example.com/home' },
    context: {
      app: { name: 'E2E Test App' },
      ip: '203.0.113.11',
      userAgent: LATEST_UA,
      page: { url: 'https://example.com/home' },
      network: { wifi: true }
    },
    traits: { email: 'e2e-page@segment.com' },
    mapping: { language: 'en' }
  })
]

// --- Legacy-mode fixtures: nested custom_data + flat app_*/device_* fields ---
const legacyFixtures: E2EFixture[] = [
  {
    description: 'Legacy mode: sends nested custom_data and flat app/device fields',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      data_format: 'legacy',
      event_name: 'checkout',
      app_name: 'E2E Legacy App',
      app_id: 'com.e2e.legacy',
      app_version: '1.0.0',
      device_brand: 'Apple',
      device_carrier: 'Verizon',
      device_model: 'iPhone15,2',
      device_type: 'ios',
      os_version: '17.2',
      custom_data: {
        currency: 'USD',
        value: 120.5,
        order_id: '$guid:legacyOrder',
        num_items: 2
      }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { email: 'e2e-legacy-checkout@segment.com' },
      context: {
        app: { name: 'E2E Legacy App', version: '1.0.0' },
        ip: '203.0.113.20',
        userAgent: LATEST_UA
      }
    }),
    expect: { status: 'success' }
  },
  {
    description: 'Legacy mode: signup event with legacy custom_data',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      data_format: 'legacy',
      event_name: 'signup',
      app_name: 'E2E Legacy App',
      custom_data: { currency: 'USD' }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Signed Up', {
      userId: nextUser(),
      properties: { email: 'e2e-legacy-signup@segment.com' },
      context: {
        app: { name: 'E2E Legacy App' },
        ip: '203.0.113.21',
        userAgent: LATEST_UA
      }
    }),
    expect: { status: 'success' }
  },
  {
    description: 'Undefined data_format (existing subscription) behaves as legacy and succeeds',
    subscribe: 'type = "track"',
    // No data_format key at all — mirrors existing subscriptions created before the toggle existed.
    // event_time/event_id use @path directives (resolved from the event) — dynamic markers like
    // $now are only resolved inside the event, not the mapping.
    mapping: {
      event_name: 'checkout',
      action_source: 'web',
      event_time: { '@path': '$.timestamp' },
      event_id: { '@path': '$.messageId' },
      app_name: 'E2E Existing App',
      user_data: {
        email: ['e2e-existing@segment.com'],
        client_ip_address: '203.0.113.22',
        client_user_agent: LATEST_UA
      },
      custom_data: { value: 100, currency: 'USD' }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      context: {
        app: { name: 'E2E Existing App' },
        ip: '203.0.113.22',
        userAgent: LATEST_UA
      }
    }),
    expect: { status: 'success' }
  }
]

// --- Invalid payloads: client-side validation failures (thrown before any HTTP request) ---
const invalidFixtures: E2EFixture[] = [
  {
    description: 'Rejects when user_data has no email, hashed_maids, or IP+UA pair',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      user_data: {}
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { order_id: 'order-123' },
      context: { app: { name: 'E2E Test App' } }
    }),
    expect: {
      status: 'error',
      errorType: 'IntegrationError',
      errorMessage:
        'User data must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields'
    }
  },
  {
    description: 'Rejects invalid event_name not in choices list',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'invalid_event_name'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Some Event', {
      userId: nextUser(),
      properties: { email: 'e2e-invalid-event@segment.com' },
      context: { app: { name: 'E2E Test App' }, ip: '203.0.113.30', userAgent: LATEST_UA }
    }),
    expect: { status: 'error', errorType: 'AggregateAjvError' }
  },
  {
    description: 'Rejects invalid action_source not in choices list',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      action_source: 'invalid_source'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { email: 'e2e-invalid-source@segment.com' },
      context: { app: { name: 'E2E Test App' }, ip: '203.0.113.31', userAgent: LATEST_UA }
    }),
    expect: { status: 'error', errorType: 'AggregateAjvError' }
  },
  {
    description: 'Rejects device_info.form_factor value not in enum',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      device_info: { form_factor: 'spaceship' }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { email: 'e2e-bad-formfactor@segment.com' },
      context: { app: { name: 'E2E Test App' }, ip: '203.0.113.32', userAgent: LATEST_UA }
    }),
    expect: { status: 'error', errorType: 'AggregateAjvError' }
  },
  {
    description: 'Rejects device_info.network_type value not in enum',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      device_info: { network_type: 'carrier_pigeon' }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { email: 'e2e-bad-network@segment.com' },
      context: { app: { name: 'E2E Test App' }, ip: '203.0.113.33', userAgent: LATEST_UA }
    }),
    expect: { status: 'error', errorType: 'AggregateAjvError' }
  },
  {
    description: 'Rejects device_info.os_name longer than 100 characters',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      device_info: { os_name: 'x'.repeat(101) }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { email: 'e2e-long-osname@segment.com' },
      context: { app: { name: 'E2E Test App' }, ip: '203.0.113.34', userAgent: LATEST_UA }
    }),
    expect: { status: 'error', errorType: 'AggregateAjvError' }
  },
  {
    description: 'Rejects contents.item_brand_id longer than 64 characters',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      contents: [{ id: 'sku-1', item_brand_id: 'y'.repeat(65) }]
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { email: 'e2e-long-brandid@segment.com' },
      context: { app: { name: 'E2E Test App' }, ip: '203.0.113.35', userAgent: LATEST_UA }
    }),
    expect: { status: 'error', errorType: 'AggregateAjvError' }
  },
  {
    description: 'Rejects device_info.languages value that is not a 2-character code',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      device_info: { languages: ['en', 'french'] }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { email: 'e2e-bad-language@segment.com' },
      context: { app: { name: 'E2E Test App' }, ip: '203.0.113.36', userAgent: LATEST_UA }
    }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'Device Info languages must each be a 2-character ISO 639-1 code. Received invalid value: "french".'
    }
  }
]

// --- Server-side failure: Pinterest rejects events older than its 7-day window ---
const serverFailureFixtures: E2EFixture[] = [
  {
    description: 'Pinterest rejects an event with a timestamp too far in the past (422)',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(reportConversionEvent.fields),
      event_name: 'checkout',
      event_time: '2020-01-01T00:00:00.000Z'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: nextUser(),
      properties: { email: 'e2e-old-event@segment.com' },
      context: { app: { name: 'E2E Test App' }, ip: '203.0.113.40', userAgent: LATEST_UA }
    }),
    expect: { status: 'failure', httpStatus: 422 },
    verboseFailureHint: 'Pinterest rejects events with event_time older than 7 days.'
  }
]

const fixtures: E2EFixture[] = [
  ...eventFixtures,
  ...legacyFixtures,
  ...invalidFixtures,
  ...serverFailureFixtures
]

export default fixtures
