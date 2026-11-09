import { processHashing } from '../../../lib/hashing-utils'
import { buildEvent, hashLast10Digits, normalizeEmail, normalizePhone, parseCurrency } from '../sendEvent/functions'
import type { Payload } from '../sendEvent/generated-types'

const EVENT_TIME = '2026-11-01T10:00:00.000Z'

const sha256 = (value: string) => processHashing(value, 'sha256', 'hex')

const payload = (overrides: Partial<Payload> = {}, userData: Partial<Payload['user_data']> = {}): Payload => ({
  name: 'page_view',
  event_time: EVENT_TIME,
  dedupe_id: 'dedupe-1',
  user_data: {
    aleid: 'ale-1',
    client_id: 'anon-1',
    client_ip_address: '203.0.113.7',
    client_user_agent: 'Mozilla/5.0 Test',
    esi: 'web',
    ...userData
  },
  ...overrides
})

describe('AppLovin Conversions API functions', () => {
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
            items: [{ item_id: 'sku-1', quantity: 2 }]
          },
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
        data: { currency: 'USD', value: 90, items: [{ item_id: 'sku-1', quantity: 2 }] }
      })
      expect(JSON.stringify(event)).not.toContain('Jane')
      expect(JSON.stringify(event)).not.toContain('555-9317')
    })

    it('passes pre-hashed values through, ignores short user IDs and normalizes zip and os', () => {
      const hashed = sha256('janedoe@gmail.com')
      const event = buildEvent(
        payload(
          {},
          { us_zip: '94107-1234', non_us_zip: 'SW1A 1AA', os: 'iOS', email: hashed.toUpperCase(), user_id: 'abc' }
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

    it('does not count ALEID as the additional identifier', () => {
      expect(() => buildEvent(payload({}, { client_id: undefined }))).toThrowError(
        'At least one identifier other than ALEID is required'
      )
    })

    it('sends data null for page_view and omits data for app_open', () => {
      expect(buildEvent(payload({ name: 'page_view' }))).toHaveProperty('data', null)
      expect(buildEvent(payload({ name: 'app_open' }, { esi: 'app' }))).not.toHaveProperty('data')
    })

    it('reports every validation error at once', () => {
      expect(() =>
        buildEvent(
          payload(
            { name: 'purchase', dedupe_id: ' ', transaction_id: ' ', items: [{ item_id: 'sku-1' }] },
            { aleid: ' ', client_id: undefined }
          )
        )
      ).toThrowError(
        'Dedupe ID is required. ALEID is required. At least one identifier other than ALEID is required: alart, axwrt, client ID, user ID, email or phone. Transaction ID is required for purchase events. Each item requires a quantity for purchase events. Currency is required for purchase events.'
      )
    })
  })
})
