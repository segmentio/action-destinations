import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { validateSubdomain } from '../sfmc-operations'

const testDestination = createTestIntegration(Definition)
const timestamp = '2022-05-12T15:21:15.449Z'

const baseSettings: Settings = {
  subdomain: 'test123',
  client_id: 'test123',
  client_secret: 'test123',
  account_id: 'test123'
}

// Subdomain values that an attacker could use to redirect requests to a host they
// control, thereby exfiltrating the OAuth client secret / bearer token. See SECOPS-25213.
const MALICIOUS_SUBDOMAINS = [
  'mc123.attacker.com/', // trailing slash makes the effective host mc123.attacker.com (attacker-controlled); the SFMC suffix becomes part of the path
  'attacker.com/', // resolves to https://attacker.com/.rest.marketingcloudapis.com/...
  'mc123.attacker.com', // dot lets the attacker prepend their own host
  'mc123@attacker.com', // userinfo trick - real host becomes attacker.com
  'mc123.attacker.com#', // fragment injection
  'mc123.attacker.com?', // query injection
  'mc123:8080', // port injection
  'mc 123', // whitespace
  'mc123/../../evil', // path traversal
  ''
]

describe('Salesforce Marketing Cloud - subdomain validation', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('validateSubdomain()', () => {
    it('accepts a valid tenant subdomain', () => {
      expect(validateSubdomain('mc563885gzs27c5t9-63k636ttgm')).toBe('mc563885gzs27c5t9-63k636ttgm')
      expect(validateSubdomain('test123')).toBe('test123')
    })

    it.each(MALICIOUS_SUBDOMAINS)('rejects malicious subdomain %p', (subdomain) => {
      expect(() => validateSubdomain(subdomain)).toThrow(PayloadValidationError)
    })

    it('rejects non-string values', () => {
      expect(() => validateSubdomain(undefined)).toThrow(PayloadValidationError)
      expect(() => validateSubdomain(null)).toThrow(PayloadValidationError)
    })
  })

  describe('contact action', () => {
    it('does not forward the request to an attacker-controlled host', async () => {
      const settings: Settings = { ...baseSettings, subdomain: 'mc123.attacker.com/' }

      // If the guard is removed, the request would go here instead of throwing.
      const attackerScope = nock('https://mc123.attacker.com').post(/.*/).reply(200, {})

      const event = createTestEvent({
        timestamp,
        type: 'identify',
        traits: { contactKey: 'ericForman15' }
      })

      await expect(
        testDestination.testAction('contact', {
          event,
          settings,
          mapping: { contactKey: { '@path': '$.traits.contactKey' } }
        })
      ).rejects.toThrow(PayloadValidationError)

      expect(attackerScope.isDone()).toBe(false)
    })
  })

  describe('apiEvent action', () => {
    it('rejects a malicious subdomain before making a request', async () => {
      const settings: Settings = { ...baseSettings, subdomain: 'attacker.com/' }
      const attackerScope = nock('https://attacker.com').post(/.*/).reply(200, {})

      const event = createTestEvent({ timestamp, type: 'track' })

      await expect(
        testDestination.testAction('apiEvent', {
          event,
          settings,
          mapping: {
            eventDefinitionKey: 'event-definition-key',
            contactKey: 'contact-key',
            data: { key: 'value' }
          }
        })
      ).rejects.toThrow(PayloadValidationError)

      expect(attackerScope.isDone()).toBe(false)
    })
  })
})
