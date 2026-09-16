import { PayloadValidationError } from '@segment/actions-core'
import type { Payload } from './streamConversion/generated-types'

export function validate(payload: Payload, conversionTime: number): void {
  if (!Number.isFinite(conversionTime)) {
    throw new PayloadValidationError('Timestamp is not a valid date.')
  }

  // Check if the timestamp is within the past 90 days
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  if (conversionTime < ninetyDaysAgo) {
    throw new PayloadValidationError('Timestamp should be within the past 90 days.')
  }

  if (
    !payload.email &&
    !payload.linkedInUUID &&
    !payload.acxiomID &&
    !payload.oracleID &&
    !payload.plaintextIpAddress?.trim() &&
    !payload.sha256IpAddress?.trim() &&
    !payload.googleAID?.trim()
  ) {
    throw new PayloadValidationError(
      'At least one user identifier is required (Email, LinkedIn First Party Ads Tracking UUID, Acxiom ID, Oracle ID, Plain Text IP Address, SHA256 IP Address, or Google Advertising ID).'
    )
  }
}
