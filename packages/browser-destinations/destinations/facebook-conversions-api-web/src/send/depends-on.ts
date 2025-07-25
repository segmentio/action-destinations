import { DependsOnConditions, Condition } from '@segment/actions-core/destination-kit/types'
import type { FBStandardEventType, FBNonStandardEventType } from '../types'

export const fieldDependencies: Record<string, (FBStandardEventType | FBNonStandardEventType)[]> = {
    custom_event_name: ['CustomEvent'],
    content_category: [],
    content_ids: ['AddPaymentInfo','AddToCart','AddToWishlist','InitiateCheckout','Purchase','Search','ViewContent'],
    content_name: [],
    content_type: ['AddToCart', 'Purchase', 'Search', 'ViewContent'],
    contents: ['AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'InitiateCheckout', 'Purchase', 'Search', 'ViewContent'],
    currency: ['AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 'InitiateCheckout', 'Lead', 'Purchase', 'Search', 'StartTrial', 'Subscribe', 'ViewContent'],
    delivery_category: [],
    num_items: ['InitiateCheckout', 'Purchase'],
    predicted_ltv: ['StartTrial', 'Subscribe'],
    search_string: ['Search'],
    status: ['CompleteRegistration'],
    value: ['AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 'InitiateCheckout', 'Lead', 'Purchase', 'Search', 'StartTrial', 'Subscribe', 'ViewContent'],
}

export function getDependenciesFor(fieldName: string): DependsOnConditions {
  const conditions: Condition[] = [
      {
          fieldKey: 'show_fields',
          operator: 'is',
          value: 'true'
      }
  ]

  if (fieldDependencies[fieldName]) {
      conditions.push({
          fieldKey: 'event_name',
          operator: 'is',
          value: fieldDependencies[fieldName]
      })
  }

  return {
      match: 'any',
      conditions
  }
}

export function getNotVisibleForEvent(event: FBStandardEventType | FBNonStandardEventType): string[] {
    return Object.entries(fieldDependencies)
        .filter(([_, events]) => !events.includes(event))
        .map(([fieldName]) => fieldName)
}