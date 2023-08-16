// Flatten JSON object
// Example: {arr: [1,2,3,4]} => {arr: "1;2;3;4"}

type JSONObject = { [key: string]: unknown } | undefined

export function flattenObject(obj: JSONObject) {
  if (typeof obj === 'undefined' || obj === null) return obj

  const flattened: JSONObject = {}

  Object.keys(obj).forEach((key: string) => {
    // Skip if the value is null or undefined or not own property

    if (typeof obj[key] === 'undefined' || obj[key] == null || !Object.prototype.hasOwnProperty.call(obj, key)) {
      return
    }

    // Flatten if item is an array
    if (obj[key] instanceof Array) {
      flattened[key] = (obj[key] as Array<unknown>)
        .map((item: unknown) => (typeof item === 'object' ? JSON.stringify(item) : item))
        .join(';')
      return
    }

    // Flatten if item is an object
    if (typeof obj[key] === 'object') {
      flattened[key] = JSON.stringify(obj[key])
      return
    }

    flattened[key] = obj[key]
  })

  return flattened
}

export enum SearchFilterOperator {
  EQ = 'EQ',
  NEQ = 'NEQ',
  LT = 'LT',
  LTE = 'LTE',
  GT = 'GT',
  GTE = 'GTE',
  BETWEEN = 'BETWEEN',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  HAS_PROPERTY = 'HAS_PROPERTY',
  NOT_HAS_PROPERTY = 'NOT_HAS_PROPERTY',
  CONTAINS_TOKEN = 'CONTAINS_TOKEN',
  NOT_CONTAINS_TOKEN = 'NOT_CONTAINS_TOKEN'
}

export interface SearchFilter {
  propertyName: string
  operator: SearchFilterOperator
  value: unknown
}

export interface SearchFilterGroup {
  filters: SearchFilter[]
}

export interface SearchPayload {
  filterGroups: SearchFilterGroup[]
  properties?: string[]
  sorts?: string[]
  limit?: number
  after?: number
}

export interface ResponseInfo {
  id: string
  properties: Record<string, string>
}

export interface SearchResponse {
  total: number
  results: ResponseInfo[]
}

export interface UpsertRecordResponse extends ResponseInfo {}

export function transformEventName(eventName: string) {
  return eventName.replace(/[\s.]+/g, '_').toLocaleLowerCase()
}

export enum AssociationCategory {
  HUBSPOT_DEFINED = 'HUBSPOT_DEFINED',
  USER_DEFINED = 'USER_DEFINED',
  INTEGRATOR_DEFINED = 'INTEGRATOR_DEFINED'
}

export interface AssociationType {
  associationCategory: AssociationCategory
  associationTypeId: number
}
export interface CreateAssociation {
  to: {
    id: string
  }
  types: AssociationType[]
}

export interface AssociationLabel {
  category: AssociationCategory
  typeId: number
  label: string
}
export interface GetAssociationLabelResponse {
  results: AssociationLabel[]
}
