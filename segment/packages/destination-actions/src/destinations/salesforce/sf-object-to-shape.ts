import {
  GenericPayload,
  GenericBaseShape,
  LeadBaseShapeType,
  CaseBaseShapeType,
  ContactBaseShapeType,
  OpportunityBaseShapeType,
  AccountBaseShapeType
} from './sf-types'

const LeadShape = (payload: GenericPayload): LeadBaseShapeType => {
  return {
    LastName: payload.last_name,
    Company: payload.company,
    FirstName: payload.first_name,
    State: payload.state,
    Street: payload.street,
    Country: payload.country,
    PostalCode: payload.postal_code,
    City: payload.city,
    Email: payload.email
  }
}

const CaseShape = (payload: GenericPayload): CaseBaseShapeType => {
  return {
    Description: payload.description
  }
}

const OpportunityShape = (payload: GenericPayload): OpportunityBaseShapeType => {
  return {
    Amount: payload.amount,
    CloseDate: payload.close_date,
    Description: payload.description,
    Name: payload.name,
    StageName: payload.stage_name
  }
}

const AccountShape = (payload: GenericPayload): AccountBaseShapeType => {
  return {
    Name: payload.name,
    AccountNumber: payload.account_number,
    NumberOfEmployees: payload.number_of_employees,
    BillingCity: payload.billing_city,
    BillingPostalCode: payload.billing_postal_code,
    BillingCountry: payload.billing_country,
    BillingStreet: payload.billing_street,
    BillingState: payload.billing_state,
    ShippingCity: payload.shipping_city,
    ShippingPostalCode: payload.shipping_postal_code,
    ShippingCountry: payload.shipping_country,
    ShippingStreet: payload.shipping_street,
    ShippingState: payload.shipping_state,
    Phone: payload.phone,
    Description: payload.description,
    Website: payload.website
  }
}

const ContactShape = (payload: GenericPayload): ContactBaseShapeType => {
  return {
    LastName: payload.last_name,
    FirstName: payload.first_name,
    AccountId: payload.account_id,
    Email: payload.email,
    MailingState: payload.mailing_state,
    MailingStreet: payload.mailing_street,
    MailingCountry: payload.mailing_country,
    MailingPostalCode: payload.mailing_postal_code,
    MailingCity: payload.mailing_city
  }
}

const objectToShape = new Map<
  string,
  (
    payload: GenericPayload
  ) => LeadBaseShapeType | CaseBaseShapeType | OpportunityBaseShapeType | AccountBaseShapeType | ContactBaseShapeType
>([
  ['lead', LeadShape],
  ['case', CaseShape],
  ['opportunity', OpportunityShape],
  ['account', AccountShape],
  ['contact', ContactShape]
])

export const mapObjectToShape = (payload: GenericPayload, sobject: string): GenericBaseShape => {
  const shapeFunction = objectToShape.get(sobject.toLowerCase())

  if (!shapeFunction) {
    throw new Error(`Undefined Object Shape: ${sobject}`)
  }

  return shapeFunction(payload)
}
