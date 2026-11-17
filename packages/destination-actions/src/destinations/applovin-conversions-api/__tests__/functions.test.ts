import { processHashing } from '../../../lib/hashing-utils'
import {
  buildEvent,
  hashLast10Digits,
  normalizeEmail,
  normalizePhone,
  parseCategoryId,
  parseCurrency
} from '../sendEvent/functions'
import type { Payload } from '../sendEvent/generated-types'

const EVENT_TIME = '2026-11-01T10:00:00.000Z'

const sha256 = (value: string) => processHashing(value, 'sha256', 'hex')

const ALEID = 'a1'.repeat(20)

const payload = (
  overrides: Partial<Payload> = {},
  userData: Partial<Payload['user_data']> = {},
  identifiers: Payload['required_identifiers'] = { client_id: 'anon-1' }
): Payload => ({
  name: 'page_view',
  event_time: EVENT_TIME,
  event_source_url: 'https://shop.example.com/',
  dedupe_id: 'dedupe-1',
  required_identifiers: identifiers,
  user_data: {
    aleid: ALEID,
    client_ip_address: '203.0.113.7',
    client_user_agent: 'Mozilla/5.0 Test',
    esi: 'web',
    ...userData
  },
  ...overrides
})

describe('AppLovin Conversions API functions', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse(EVENT_TIME))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('parseCurrency', () => {
    it('trims and uppercases valid codes', () => {
      expect(parseCurrency(' usd ')).toEqual({ code: 'USD' })
      expect(parseCurrency('  ')).toEqual({})
    })

    it('rejects malformed codes', () => {
      expect(parseCurrency('US').error).toContain('ISO 4217')
      expect(parseCurrency('U$D').error).toContain('ISO 4217')
    })
  })

  describe('normalizeEmail', () => {
    it('lowercases and removes gmail dots and plus tags', () => {
      expect(normalizeEmail('Jane.Doe+Work@GoogleMail.com')).toBe('janedoe@googlemail.com')
      expect(normalizeEmail('  J..A.NE+work.more+extra@GMAIL.COM  ')).toBe('jane@gmail.com')
      expect(normalizeEmail(' Jane.Doe@Example.com ')).toBe('jane.doe@example.com')
    })

    it('returns an empty string for malformed emails', () => {
      expect(normalizeEmail('not-an-email')).toBe('')
      expect(normalizeEmail('+tag@gmail.com')).toBe('')
      expect(normalizeEmail('jané@example.com')).toBe('')
    })
  })

  describe('normalizePhone', () => {
    it('keeps digits only and drops leading zeros', () => {
      expect(normalizePhone('+1 (415) 555-9317')).toBe('14155559317')
      expect(normalizePhone('0044 20 7946 0958')).toBe('442079460958')
    })
  })

  describe('hashLast10Digits', () => {
    it('hashes the last 10 digits', () => {
      expect(hashLast10Digits('+1 (415) 555-9317')).toBe(sha256('4155559317'))
    })

    it('returns undefined for short numbers or numbers with letters', () => {
      expect(hashLast10Digits('555-9317')).toBeUndefined()
      expect(hashLast10Digits('1-800-FLOWERS')).toBeUndefined()
    })
  })

  describe('buildEvent', () => {
    it('hashes email and phone and sends no plaintext PII', () => {
      const event = buildEvent(
        payload(
          {
            name: 'purchase',
            currency: 'usd',
            value: 90,
            transaction_id: 'order-9',
            shipping: 5,
            tax: 7,
            items: [{ item_id: 'sku-1', item_name: 'Shoe', price: 45, quantity: 2 }]
          },
          {},
          { email: 'Jane.Doe+Work@Gmail.com', phone: '+1 (415) 555-9317', user_id: 'customer-12345' }
        )
      )

      expect(event.user_data).toMatchObject({
        email: sha256('janedoe@gmail.com'),
        phone: sha256('14155559317'),
        phone_last10_hashed: sha256('4155559317'),
        user_id: 'customer-12345'
      })
      expect(event).toMatchObject({
        event_time: Date.parse(EVENT_TIME),
        data: { currency: 'USD', value: 90, items: [{ item_id: 'sku-1', item_name: 'Shoe', price: 45, quantity: 2 }] }
      })
      expect(JSON.stringify(event)).not.toContain('Jane')
      expect(JSON.stringify(event)).not.toContain('555-9317')
    })

    it('passes pre-hashed values through, ignores short user IDs and normalizes zip and os', () => {
      const hashed = sha256('janedoe@gmail.com')
      const event = buildEvent(
        payload(
          {},
          { us_zip: '94107-1234', non_us_zip: 'SW1A 1AA', os: 'iOS' },
          { email: hashed.toUpperCase(), user_id: 'abc' }
        )
      )

      expect(event.user_data).toMatchObject({ email: hashed, zip: '94107', os: 'ios' })
      expect(event.user_data.user_id).toBeUndefined()
      expect(buildEvent(payload({}, { non_us_zip: 'SW1A 1AA', os: 'Linux' })).user_data).toMatchObject({
        zip: 'SW1A 1AA',
        os: 'desktop_os'
      })
    })

    it.each([
      ['iOS', 'ios'],
      ['iPadOS', 'ios'],
      ['Android', 'android'],
      ['macOS', 'macos'],
      ['Windows', 'windows'],
      ['Linux', 'desktop_os']
    ])('maps the Segment OS name %s to %s', (name: string, expected: string) => {
      expect(buildEvent(payload({}, { os: name })).user_data.os).toBe(expected)
    })

    it.each([
      ['client_id', { client_id: 'anon-1' }],
      ['user_id', { user_id: 'customer-12345' }],
      ['email', { email: 'jane@example.com' }],
      ['phone', { phone: '+1 415 555 9317' }]
    ])('accepts %s as the only identifier', (_key: string, identifiers: Payload['required_identifiers']) => {
      expect(() => buildEvent(payload({}, {}, identifiers))).not.toThrow()
    })

    it('does not count ALEID, ALART, AXWRT or a short user ID as an identifier', () => {
      expect(() =>
        buildEvent(payload({}, { alart: 'alart-1', axwrt: 'axwrt-1' }, { user_id: 'abc', email: 'not-an-email' }))
      ).toThrowError('At least one of Client ID, User ID, Email or Phone is required.')
    })

    it('accepts multiple identifiers', () => {
      const event = buildEvent(payload({}, {}, { client_id: 'anon-1', user_id: 'customer-12345' }))
      expect(event.user_data).toMatchObject({ client_id: 'anon-1', user_id: 'customer-12345' })
    })

    it('does not require ALEID', () => {
      const event = buildEvent(payload({}, { aleid: undefined }))
      expect(event.user_data).not.toHaveProperty('aleid')
    })

    it.each(['short', 'a1'.repeat(19), 'a1'.repeat(21)])(
      'rejects an ALEID that is not 40 characters: %s',
      (aleid: string) => {
        expect(() => buildEvent(payload({}, { aleid }))).toThrowError('ALEID must be exactly 40 characters.')
      }
    )

    it('requires Event Source URL when the event source is web', () => {
      expect(() => buildEvent(payload({ event_source_url: undefined }))).toThrowError(
        'Event Source URL is required when Event Source is web.'
      )
      expect(() => buildEvent(payload({ event_source_url: undefined }, { esi: 'app' }))).not.toThrow()
    })

    it.each(['begin_checkout', 'purchase'] as const)(
      'requires Item Name, Price and Quantity on every item for %s',
      (name) => {
        const base = { name, currency: 'USD', value: 10, transaction_id: 'order-1', shipping: 0, tax: 0 }
        const good = { item_id: 'sku-1', item_name: 'Shoe', price: 45, quantity: 1 }
        expect(() => buildEvent(payload({ ...base, items: [good] }))).not.toThrow()
        expect(() => buildEvent(payload({ ...base, items: [good, { ...good, item_name: undefined }] }))).toThrowError(
          `Each item requires an Item Name and Price for ${name} events.`
        )
        expect(() => buildEvent(payload({ ...base, items: [{ ...good, price: undefined }] }))).toThrowError(
          `Each item requires an Item Name and Price for ${name} events.`
        )
        expect(() => buildEvent(payload({ ...base, items: [{ ...good, quantity: undefined }] }))).toThrowError(
          `Each item requires a quantity for ${name} events.`
        )
      }
    )

    it('does not require item name or price for other events', () => {
      expect(() =>
        buildEvent(payload({ name: 'add_to_cart', items: [{ item_id: 'sku-1', quantity: 1 }] }))
      ).not.toThrow()
    })

    it('sends only the numeric category ID and rejects unknown categories', () => {
      const items = (item_category_id: string) => [{ item_id: 'sku-1', item_category_id }]
      const event = buildEvent(payload({ name: 'view_item', items: items('166 (Apparel & Accessories)') }))
      expect(event).toMatchObject({ data: { items: [{ item_id: 'sku-1', item_category_id: 166 }] } })
      expect(buildEvent(payload({ name: 'view_item', items: items('166') }))).toMatchObject({
        data: { items: [{ item_category_id: 166 }] }
      })
      for (const bad of ['Apparel', '99999999 (Nope)']) {
        expect(() => buildEvent(payload({ name: 'view_item', items: items(bad) }))).toThrowError(
          'Each Item Category ID must be a valid category from the AppLovin category list.'
        )
      }
    })

    it('sends data null for page_view and omits data for app_open', () => {
      expect(buildEvent(payload({ name: 'page_view' }))).toHaveProperty('data', null)
      expect(buildEvent(payload({ name: 'app_open' }, { esi: 'app' }))).not.toHaveProperty('data')
    })

    it.each([
      ['more than 730 days old', '2024-10-01T10:00:00.000Z', 'Event Time cannot be more than 730 days old.'],
      [
        'more than 1 hour in the future',
        '2026-11-01T11:30:00.000Z',
        'Event Time cannot be more than 1 hour in the future.'
      ]
    ])('rejects an event time %s', (_label: string, event_time: string, message: string) => {
      expect(() => buildEvent(payload({ event_time }))).toThrowError(message)
    })

    it('accepts event times just inside the window', () => {
      expect(() => buildEvent(payload({ event_time: '2024-11-02T10:00:00.000Z' }))).not.toThrow()
      expect(() => buildEvent(payload({ event_time: '2026-11-01T10:59:00.000Z' }))).not.toThrow()
    })

    it.each(['not-an-ip', '203.0.113.999', '203.0.113'])('rejects the invalid IP address %s', (ip: string) => {
      expect(() => buildEvent(payload({}, { client_ip_address: ip }))).toThrowError(
        'IP Address must be a valid IPv4 or IPv6 address.'
      )
    })

    it('accepts IPv6 addresses', () => {
      expect(buildEvent(payload({}, { client_ip_address: '2001:db8::1' })).user_data.client_ip_address).toBe(
        '2001:db8::1'
      )
    })

    it('reports every validation error at once', () => {
      expect(() =>
        buildEvent(
          payload(
            { name: 'purchase', dedupe_id: ' ', transaction_id: ' ', items: [{ item_id: 'sku-1' }] },
            { aleid: 'short' },
            {}
          )
        )
      ).toThrowError(
        'Dedupe ID is required. ALEID must be exactly 40 characters. At least one of Client ID, User ID, Email or Phone is required. Transaction ID is required for purchase events. Each item requires a quantity for purchase events. Each item requires an Item Name and Price for purchase events. Currency is required for purchase events.'
      )
    })
  })

  describe('parseCategoryId', () => {
    it('parses the leading ID and only accepts IDs in the list', () => {
      expect(parseCategoryId('166 (Apparel & Accessories)')).toBe(166)
      expect(parseCategoryId(' 1 ')).toBe(1)
      expect(parseCategoryId('0')).toBeUndefined()
      expect(parseCategoryId('Apparel')).toBeUndefined()
      expect(parseCategoryId(undefined)).toBeUndefined()
    })
  })
})
