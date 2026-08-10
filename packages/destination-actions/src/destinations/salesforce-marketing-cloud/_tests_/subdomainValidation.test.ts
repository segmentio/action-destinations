import { createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { validateSubdomain } from '../sfmc-operations'

const testDestination = createTestIntegration(Definition)

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

  // The subdomain is validated only at settings-save time (testAuthentication), so an
  // invalid or injection value is rejected before it can ever be stored - the customer
  // gets a clear, immediate error. We intentionally do NOT re-validate on every event
  // to avoid breaking delivery for any pre-existing config. See SECOPS-25213.
  describe('testAuthentication', () => {
    it('accepts a valid subdomain', async () => {
      await expect(testDestination.testAuthentication(baseSettings)).resolves.not.toThrow()
    })

    // The core wrapper re-throws as a generic Error but preserves the message, so the
    // customer sees the subdomain problem immediately at save time.
    it.each(MALICIOUS_SUBDOMAINS)('rejects malicious subdomain %p at settings-save time', async (subdomain) => {
      const settings: Settings = { ...baseSettings, subdomain }
      await expect(testDestination.testAuthentication(settings)).rejects.toThrow(
        'Invalid Salesforce Marketing Cloud subdomain'
      )
    })
  })
})
