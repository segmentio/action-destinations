import type { Payload as LeadPayload } from './lead/generated-types'
import type { Payload as CustomPayload } from './customObject/generated-types'
import type { Payload as CasePayload } from './cases/generated-types'
import type { Payload as ContactPayload } from './contact/generated-types'
import type { Payload as OpportunityPayload } from './opportunity/generated-types'
import type { Payload as AccountPayload } from './account/generated-types'
export declare type GenericPayload = Partial<
  LeadPayload & CustomPayload & CasePayload & AccountPayload & OpportunityPayload & ContactPayload
>
export declare type LeadBaseShapeType = {
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
export declare type CaseBaseShapeType = {
  Description?: string
}
export declare type ContactBaseShapeType = {
  LastName?: string
  FirstName?: string
  AccountId?: string
  MailingState?: string
  MailingStreet?: string
  MailingCountry?: string
  MailingPostalCode?: string
  MailingCity?: string
  Email?: string
}
export declare type OpportunityBaseShapeType = {
  Amount?: string
  CloseDate?: string
  Description?: string
  Name?: string
  StageName?: string
}
export declare type AccountBaseShapeType = {
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
export declare type GenericBaseShape = Partial<
  LeadBaseShapeType & CaseBaseShapeType & AccountBaseShapeType & OpportunityBaseShapeType & ContactBaseShapeType
>
