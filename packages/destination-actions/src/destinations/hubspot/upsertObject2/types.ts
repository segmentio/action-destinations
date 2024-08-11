export type HubspotStringType = 'date' | 'datetime' | 'string'

export interface Schema {
    properties: Prop[]
    sensitiveProperties: Prop[]
}

export interface Prop {
  name: string
  type: string | number | boolean | object | null
  format: 'date' | 'datetime' | 'string'
}

