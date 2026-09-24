import { validate } from '../functions'
import type { Payload } from '../streamConversion/generated-types'

const basePayload: Payload = {
  conversionHappenedAt: '1700000000000'
}

describe('validate', () => {
  it('throws when the conversion timestamp is not a valid date', () => {
    const payload: Payload = {
      ...basePayload,
      googleAID: 'AEBE52E7-03EE-455A-B3C4-E57283966239'
    }

    expect(() => validate(payload, NaN)).toThrowError('Timestamp is not a valid date.')
  })

  it('throws when every identifier is whitespace-only', () => {
    const payload: Payload = {
      ...basePayload,
      email: '   ',
      linkedInUUID: '   ',
      acxiomID: '   ',
      oracleID: '   ',
      plaintextIpAddress: '   ',
      sha256IpAddress: '   ',
      googleAID: '   '
    }

    expect(() => validate(payload, Date.now())).toThrowError(
      'At least one user identifier is required (Email, LinkedIn First Party Ads Tracking UUID, Acxiom ID, Oracle ID, Plain Text IP Address, SHA256 IP Address, or Google Advertising ID).'
    )
  })

  it.each(['email', 'linkedInUUID', 'acxiomID', 'oracleID', 'plaintextIpAddress', 'sha256IpAddress', 'googleAID'])(
    'does not throw when %s is the only identifier and is non-empty after trimming',
    (field) => {
      const payload: Payload = {
        ...basePayload,
        [field]: '  value  '
      }

      expect(() => validate(payload, Date.now())).not.toThrow()
    }
  )
})
