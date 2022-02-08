import type { Payload as LeadPayload } from './lead/generated-types'
import type { Payload as CustomPayload } from './customObject/generated-types'

export type GenericPayload = Partial<LeadPayload & CustomPayload>

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

export type GenericBaseShape = Partial<LeadBaseShapeType>
