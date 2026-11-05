import crypto from 'crypto'
import { buildJSON } from '../functions'
import type { Payload } from '../sendConversion/generated-types'

const NOW = Date.parse('2026-11-03T12:00:00.000Z')
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

const basePayload: Payload = {
  event_type: 'order_created',
  event_id: 'evt-1',
  timestamp: '2026-11-03T11:59:00.000Z',
  action_source: 'web',
  source_url: 'https://example.com/checkout',
  essential_identifiers: { email: ['jane@example.com'] }
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('buildJSON', () => {
  it('builds a full web order event', () => {
    expect(
      buildJSON({
        ...basePayload,
        event_id: '  evt-1  ',
        oppref: ' opp_1 ',
        opt_out: false,
        amount: 100.05,
        currency: ' usd ',
        contents: [
          {
            id: ' sku_1 ',
            group_id: 'cat_1',
            name: ' Shirt ',
            content_type: 'product',
            quantity: 2.9,
            amount: 50.02,
            size: ' M ',
            pieces: 2
          },
          { id: '   ' }
        ],
        essential_identifiers: {
          email: [' Jane@Example.com '],
          phone: ['+1 (415) 555-0100'],
          android_advertising_id: 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
        },
        matching_data: {
          obref: ' anon_1 ',
          external_id: ' User-1 ',
          user_agent: ' Mozilla/5.0 ',
          ip_address: ' 203.0.113.9 ',
          first_name: ' Jane ',
          last_name: "O'Brien",
          city: ' Austin ',
          region: ' Texas ',
          country: ' us ',
          postal_code: ' 78701 '
        }
      })
    ).toEqual({
      id: 'evt-1',
      type: 'order_created',
      timestamp_ms: Date.parse('2026-11-03T11:59:00.000Z'),
      action_source: 'web',
      source_url: 'https://example.com/checkout',
      oppref: 'opp_1',
      opt_out: false,
      user: {
        emails_sha256: [sha256('jane@example.com')],
        phone_numbers_sha256: [sha256('14155550100')],
        android_advertising_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        external_ids_sha256: [sha256('User-1')],
        obref: 'anon_1',
        user_agent: 'Mozilla/5.0',
        ip_address: '203.0.113.9',
        first_names_sha256: [sha256('jane')],
        last_names_sha256: [sha256('obrien')],
        cities: ['Austin'],
        regions: ['Texas'],
        countries: ['US'],
        postal_codes: ['78701']
      },
      data: {
        type: 'contents',
        amount: 10005,
        currency: 'USD',
        contents: [
          {
            id: 'sku_1',
            group_id: 'cat_1',
            name: 'Shirt',
            content_type: 'product',
            quantity: 2,
            amount: 5002,
            currency: 'USD',
            variant_dict: { size: 'M', pieces: '2' }
          }
        ]
      }
    })
  })

  it('does not hash values that are already hashed', () => {
    const emailHash = sha256('jane@example.com')
    const nameHash = sha256('jane')
    const { user } = buildJSON({
      ...basePayload,
      essential_identifiers: { email: [emailHash] },
      matching_data: { first_name: nameHash.toUpperCase() }
    })
    expect(user.emails_sha256).toEqual([emailHash])
    expect(user.first_names_sha256).toEqual([nameHash])
  })

  it('sends up to 3 hashed emails and phones, skipping blanks and ignoring extras', () => {
    const { user } = buildJSON({
      ...basePayload,
      essential_identifiers: {
        email: ['A@example.com', '  ', 'b@example.com', 'c@example.com', 'd@example.com'],
        phone: ['+14155550100', '12345', '+14155550101']
      }
    })
    expect(user.emails_sha256).toEqual(['a@example.com', 'b@example.com', 'c@example.com'].map(sha256))
    expect(user.phone_numbers_sha256).toEqual([sha256('14155550100'), sha256('14155550101')])
  })

  it('accepts any single essential identifier', () => {
    expect(buildJSON({ ...basePayload, essential_identifiers: { phone: ['4155550100'] } }).user).toEqual({
      phone_numbers_sha256: [sha256('4155550100')]
    })
    expect(
      buildJSON({
        ...basePayload,
        essential_identifiers: { android_advertising_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }
      }).user
    ).toEqual({ android_advertising_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' })
  })

  it.each([
    ['no essential identifiers', {}],
    ['blank essential identifiers', { email: ['   '], phone: [' '] }],
    ['a phone that normalises to nothing', { phone: ['12345'] }],
    ['an all-zero GAID', { android_advertising_id: '00000000-0000-0000-0000-000000000000' }]
  ])('rejects %s', (_label, essentialIdentifiers) => {
    expect(() => buildJSON({ ...basePayload, essential_identifiers: essentialIdentifiers })).toThrow(
      'At least one valid essential identifier'
    )
  })

  it('does not count matching data identifiers as an essential identifier', () => {
    expect(() =>
      buildJSON({
        ...basePayload,
        essential_identifiers: {},
        matching_data: { external_id: 'user-1', obref: 'anon_1' }
      })
    ).toThrow('At least one valid essential identifier')
  })

  it('omits contents for customer_action events and plan_id for contents events', () => {
    expect(
      buildJSON({ ...basePayload, event_type: 'lead_created', contents: [{ id: 'sku_1' }], plan_id: 'pro' }).data
    ).toEqual({
      type: 'customer_action'
    })
    expect(buildJSON({ ...basePayload, plan_id: 'pro' }).data).toEqual({ type: 'contents' })
  })

  it('includes plan_id for subscription events', () => {
    expect(buildJSON({ ...basePayload, event_type: 'subscription_created', plan_id: ' pro_annual ' }).data).toEqual({
      type: 'plan_enrollment',
      plan_id: 'pro_annual'
    })
  })

  it('builds a custom event with a lowercased name', () => {
    const event = buildJSON({ ...basePayload, event_type: 'custom', custom_event_name: ' Webinar_Watched ' })
    expect(event.type).toBe('custom')
    expect(event.custom_event_name).toBe('webinar_watched')
    expect(event.data).toEqual({ type: 'custom' })
  })

  it('builds an app event without a source URL', () => {
    const event = buildJSON({
      ...basePayload,
      event_type: 'app_installed',
      action_source: 'mobile_app',
      source_url: undefined
    })
    expect(event).not.toHaveProperty('source_url')
    expect(event.data).toEqual({ type: 'customer_action' })
  })

  it('allows a standard event type with the mobile_app action source', () => {
    expect(buildJSON({ ...basePayload, action_source: 'mobile_app', source_url: undefined }).action_source).toBe(
      'mobile_app'
    )
  })

  it.each([
    ['app event with a non-mobile action source', { event_type: 'app_opened' }, 'must be Mobile App'],
    ['web event without a source URL', { source_url: '  ' }, 'Source URL is required'],
    ['custom event without a name', { event_type: 'custom' }, 'Custom Event Name is required'],
    ['amount without currency', { amount: 5 }, 'Currency is required'],
    ['blank event ID', { event_id: '   ' }, 'Event ID is required'],
    ['stale timestamp', { timestamp: '2026-10-01T00:00:00.000Z' }, 'more than 7 days old'],
    ['unknown country', { matching_data: { country: 'ZZ' } }, 'ISO 3166-1'],
    ['invalid IP address', { matching_data: { ip_address: 'nope' } }, 'IPv4 or IPv6'],
    ['item amount without currency', { contents: [{ id: 'a', amount: 1 }] }, 'Currency is required']
  ] as [string, Partial<Payload>, string][])('rejects %s', (_label, overrides, message) => {
    expect(() => buildJSON({ ...basePayload, ...overrides })).toThrow(message)
  })
})
