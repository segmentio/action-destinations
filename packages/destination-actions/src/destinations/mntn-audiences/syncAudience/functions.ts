import {
  RequestClient,
  MultiStatusResponse,
  JSONLikeObject,
  AudienceMembership,
  HTTPError,
  PayloadValidationError
} from '@segment/actions-core'
import { processHashing } from '../../../lib/hashing-utils'
import type { Payload } from './generated-types'
import type { IdentifierKind, IdentityPayload, PayloadWithIndex } from './types'
import { MNTN_API_BASE } from '../constants'
import { MNTN_API_VERSION } from '../versioning-info'

function sha256(value: string): string {
  return processHashing(value, 'sha256', 'hex')
}

export function buildIdentity(payload: Payload): IdentityPayload {
  const { email, phone, ip, maid, identity_id, timestamp } = payload
  const identifiers: Array<{ kind: IdentifierKind; value: string }> = []

  if (email) {
    const normalized = email.toLowerCase().trim()
    if (normalized) {
      identifiers.push({ kind: 'email', value: normalized })
      identifiers.push({ kind: 'email_sha256', value: sha256(normalized) })
    }
  }

  if (phone) {
    const normalized = phone.replace(/\D/g, '')
    if (normalized) {
      identifiers.push({ kind: 'phone', value: normalized })
      identifiers.push({ kind: 'phone_sha256', value: sha256(normalized) })
    }
  }

  if (ip) {
    const normalized = ip.trim()
    if (normalized) {
      identifiers.push({ kind: 'ipv4', value: normalized })
    }
  }

  if (maid) {
    const normalized = maid.trim()
    if (normalized) {
      identifiers.push({ kind: 'maid', value: normalized })
    }
  }

  return {
    id: identity_id,
    source: 'segment',
    ...(timestamp ? { source_time: { rfc3339: timestamp } } : {}),
    identifiers
  }
}

function markSuccess(msResponse: MultiStatusResponse | undefined, entries: PayloadWithIndex[]) {
  entries.forEach(({ index, p, identity }) => {
    msResponse?.setSuccessResponseAtIndex(index, {
      status: 202,
      sent: p as unknown as JSONLikeObject,
      body: identity as unknown as JSONLikeObject
    })
  })
}

function markError(msResponse: MultiStatusResponse | undefined, entries: PayloadWithIndex[], error: unknown) {
  const status = (error as HTTPError)?.response?.status ?? 500
  const errormessage = error instanceof Error ? error.message : 'Request to MNTN failed.'
  entries.forEach(({ index, p, identity }) => {
    msResponse?.setErrorResponseAtIndex(index, {
      status,
      errormessage,
      sent: p as unknown as JSONLikeObject,
      body: identity as unknown as JSONLikeObject
    })
  })
}

export async function syncAudience(
  request: RequestClient,
  payloads: Payload[],
  audienceMemberships: AudienceMembership[],
  isBatch: boolean
) {
  const msResponse = isBatch ? new MultiStatusResponse() : undefined
  const adds: PayloadWithIndex[] = []
  const removes: PayloadWithIndex[] = []
  const seen = new Set<string>()
  const segment_id = payloads[0].segment_id // batch_keys ensure this is static for a batch of events

  payloads.forEach((p, index) => {
    const { identity_id } = p

    if (seen.has(identity_id)) {
      msResponse?.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage: `Duplicate identity_id "${identity_id}".`,
        sent: p as unknown as JSONLikeObject,
        body: {}
      })
      return
    }
    seen.add(identity_id)

    const membership = audienceMemberships[index]
    if (typeof membership !== 'boolean') {
      const errormessage = `Missing audience membership for identity_id "${identity_id}". Expected a boolean indicating whether the user was added to or removed from the audience.`
      if (!isBatch) {
        throw new PayloadValidationError(errormessage)
      }
      msResponse?.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage,
        sent: p as unknown as JSONLikeObject,
        body: {}
      })
      return
    }

    const identity = buildIdentity(p)
    if (membership) {
      adds.push({ index, p, identity })
    } else {
      removes.push({ index, p, identity })
    }
  })

  const encodedSegmentId = encodeURIComponent(segment_id)

  if (adds.length > 0) {
    const json = adds.length === 1
      ? { identity: adds[0].identity }
      : { identities: adds.map(({ identity }) => identity) }

    try {
      const response = await request(`${MNTN_API_BASE}/${MNTN_API_VERSION}/audience/segments/${encodedSegmentId}/identities`, {
        method: 'POST',
        json
      })
      if (!isBatch) {
        return response
      }
      markSuccess(msResponse, adds)
    } catch (error) {
      if (!isBatch) {
        throw error
      }
      markError(msResponse, adds, error)
    }
  }

  if (removes.length > 0) {
    const encodedIds = encodeURIComponent(removes.map(({ identity: { id } }) => id).join(','))

    try {
      const response = await request(
        `${MNTN_API_BASE}/${MNTN_API_VERSION}/audience/segments/${encodedSegmentId}/identities/${encodedIds}`,
        { method: 'DELETE' }
      )
      if (!isBatch) {
        return response
      }
      markSuccess(msResponse, removes)
    } catch (error) {
      if (!isBatch) {
        throw error
      }
      markError(msResponse, removes, error)
    }
  }

  return msResponse
}
