import type { Payload } from './generated-types'

export type IdentifierKind = 'email' | 'email_sha256' | 'phone' | 'phone_sha256' | 'ipv4' | 'maid'

export interface IdentityPayload {
  id: string
  source: string
  source_time?: { rfc3339: string }
  identifiers: Array<{ kind: IdentifierKind; value: string }>
}

export type PayloadWithIndex = { index: number; p: Payload; identity: IdentityPayload }
