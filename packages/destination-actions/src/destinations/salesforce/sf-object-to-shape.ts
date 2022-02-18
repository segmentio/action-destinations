import { GenericPayload, GenericBaseShape, LeadBaseShapeType, CaseBaseShapeType } from './sf-types'

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

const objectToShape = new Map<string, (payload: GenericPayload) => LeadBaseShapeType | CaseBaseShapeType>([
  ['lead', LeadShape],
  ['case', CaseShape]
])

export const mapObjectToShape = (payload: GenericPayload, sobject: string): GenericBaseShape => {
  const shapeFunction = objectToShape.get(sobject.toLowerCase())

  if (!shapeFunction) {
    throw new Error(`Undefined Object Shape: ${sobject}`)
  }

  return shapeFunction(payload)
}
