import { JSONLikeObject } from '@segment/actions-core/json-object'

export interface CatalogSchema {
  description?: string
  fields?: {
    name: string
    token: string
    type: 'string' | 'number' | 'time' | 'boolean'
  }[]
  name: string
  num_items?: Number
  storage_size?: Number
  updated_at?: string
  selections_size?: Number
  source?: Number
  selections: unknown[]
}

export interface ListCatalogsResponse {
  catalogs?: CatalogSchema[]
  message?: string
}

export interface UpsertCatalogItemErrorResponse {
  message?: string
  errors: {
    id?: string
    message?: string
    parameters?: string[]
    parameter_values?: string[] | JSONLikeObject[]
  }[]
}
