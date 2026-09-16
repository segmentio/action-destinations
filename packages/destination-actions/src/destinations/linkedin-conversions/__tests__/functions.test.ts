import { validate } from '../functions'
import type { Payload } from '../streamConversion/generated-types'

const basePayload: Payload = {
  conversionHappenedAt: '1700000000000'
}

describe('validate', () => {
  it('throws when every identifier is whitespace-only', () => {
    const payload: Payload = {
      ...basePayload,
      plaintextIpAddress: '   ',
      sha256IpAddress: '   ',
      googleAID: '   '
    }

    expect(() => validate(payload, Date.now())).toThrowError(
      'At least one user identifier is required (Email, LinkedIn First Party Ads Tracking UUID, Acxiom ID, Oracle ID, Plain Text IP Address, SHA256 IP Address, or Google Advertising ID).'
    )
  })

  it('does not throw when at least one identifier is a non-empty string after trimming', () => {
    const payload: Payload = {
      ...basePayload,
      googleAID: '  AEBE52E7-03EE-455A-B3C4-E57283966239  '
    }

    expect(() => validate(payload, Date.now())).not.toThrow()
  })
})
