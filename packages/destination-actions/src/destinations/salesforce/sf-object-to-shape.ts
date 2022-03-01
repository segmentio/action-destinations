import {
  GenericPayload,
  GenericBaseShape,
  LeadBaseShapeType,
  CaseBaseShapeType,
  ContactBaseShapeType
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

const ContactShape = (payload: GenericPayload): ContactBaseShapeType => {
  return {
    LastName: payload.last_name,
    FirstName: payload.first_name,
    Email: payload.email,
    MailingState: payload.mailing_state,
    MailingStreet: payload.mailing_street,
    MailingCountry: payload.mailing_country,
    MailingPostalCode: payload.mailing_postal_code,
    MailingCity: payload.mailing_city
  }
}

const objectToShape = new Map<string, (payload: GenericPayload) => LeadBaseShapeType | CaseBaseShapeType>([
  ['lead', LeadShape],
  ['case', CaseShape],
  ['contact', ContactShape]
])

export const mapObjectToShape = (payload: GenericPayload, sobject: string): GenericBaseShape => {
  const shapeFunction = objectToShape.get(sobject.toLowerCase())

  if (!shapeFunction) {
    throw new Error(`: ${sobject}`)
  }

  return shapeFunction(payload)
}
