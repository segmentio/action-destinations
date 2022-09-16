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

export interface QueryResponse {
  results: Array<ConversionCustomVariable>
}

export interface PartialFailureError {
  partialFailureError: {
    code: number
    message: string
  }
}
