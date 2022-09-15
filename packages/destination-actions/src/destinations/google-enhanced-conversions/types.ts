export interface ConversionCustomVariable {
  conversionCustomVariable: {
    resourceName: string
    id: string
    name: string
  }
}

export interface QueryResponse {
  results: Array<ConversionCustomVariable>
}
