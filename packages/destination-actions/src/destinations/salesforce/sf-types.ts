import type { Payload as LeadPayload } from './lead/generated-types'
import type { Payload as CustomPayload } from './customObject/generated-types'
import type { Payload as CasePayload } from './case/generated-types'

export type GenericPayload = Partial<LeadPayload & CustomPayload & CasePayload>

export type LeadBaseShapeType = {
  LastName?: string
  Company?: string
  FirstName?: string
  State?: string
  Street?: string
  Country?: string
  PostalCode?: string
  City?: string
  Email?: string
}

export type CaseBaseShapeType = {
  Description?: string
}

export type GenericBaseShape = Partial<LeadBaseShapeType & CaseBaseShapeType>
