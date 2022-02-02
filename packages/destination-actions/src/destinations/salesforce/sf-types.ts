import type { Payload as LeadPayload } from './lead/generated-types'
import type { Payload as CustomPayload } from './custom/generated-types'

export type GenericPayload = Partial<LeadPayload & CustomPayload>
