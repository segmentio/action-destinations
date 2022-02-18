import {
  GenericPayload,
  GenericBaseShape,
  LeadBaseShapeType,
  CaseBaseShapeType,
  OpportunityBaseShapeType
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

const objectToShape = new Map<string, (payload: GenericPayload) => LeadBaseShapeType | CaseBaseShapeType>([
  ['lead', LeadShape],
  ['case', CaseShape],
  ['opportunity', OpportunityShape]
])

export const mapObjectToShape = (payload: GenericPayload, sobject: string): GenericBaseShape => {
  const shapeFunction = objectToShape.get(sobject.toLowerCase())

  if (!shapeFunction) {
    throw new Error(`Undefined Object Shape: ${sobject}`)
  }

  return shapeFunction(payload)
}
