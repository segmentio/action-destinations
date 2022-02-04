import { GenericPayload } from './sf-types'

const LeadShape = (payload: GenericPayload) => {
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

const objectToShape = new Map([['lead', LeadShape]])

export const mapObjectToShape = (payload: GenericPayload, sobject: string) => {
  const shapeFunction = objectToShape.get(sobject.toLowerCase())

  if (!shapeFunction) {
    throw new Error(`Undefined Object Shape: ${sobject}`)
  }

  return shapeFunction(payload)
}
