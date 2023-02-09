import { Features } from '@segment/actions-core/src/mapping-kit'

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

export interface PartialErrorResponse {
  partialFailureError: {
    code: number
    message: string
  }
  results: {}[]
}

export function getUrlByVersion(features: Features | undefined): string {
  if (features && features['google-enhanced-v12']) {
    return 'https://googleads.googleapis.com/v12/customers'
  }
  return 'https://googleads.googleapis.com/v11/customers'
}
