import type { Payload as LeadPayload } from './lead/generated-types'
import type { Payload as CustomPayload } from './customObject/generated-types'
import type { Payload as CasePayload } from './case/generated-types'
import type { Payload as AccountPayload } from './account/generated-types'

export type GenericPayload = Partial<LeadPayload & CustomPayload & CasePayload & AccountPayload>

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

export type AccountBaseShapeType = {
  Name?: string
  AccountNumber?: string
  NumberOfEmployees?: number
  BillingCity?: string
  BillingPostalCode?: string
  BillingCountry?: string
  BillingStreet?: string
  BillingState?: string
  ShippingCity?: string
  ShippingPostalCode?: string
  ShippingCountry?: string
  ShippingStreet?: string
  ShippingState?: string
  Phone?: string
  Description?: string
  Website?: string
}

export type GenericBaseShape = Partial<LeadBaseShapeType & CaseBaseShapeType & AccountBaseShapeType>
