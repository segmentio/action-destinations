export interface CartItem {
  productId?: string
  quantity?: number
  unitPrice?: number
}

export interface ConversionCustomVariable {
  conversionCustomVariable: {
    resourceName: string
    id: string
    name: string
  }
}

export interface ConversionActionId {
  conversionAction: {
    resourceName: string
    id: string
    name: string
  }
}

export interface ConversionActionResponse {
  results: Array<ConversionActionId>
  fieldMask: string
  requestId: string
}

export interface QueryResponse {
  results: Array<ConversionCustomVariable>
}

export interface PartialErrorResponse {
  partialFailureError: {
    code: number
    message: string
  }
  results: {}[]
}
