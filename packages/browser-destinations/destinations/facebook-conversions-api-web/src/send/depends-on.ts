import { DependsOnConditions, Condition } from '@segment/actions-core/destination-kit/types'
import type { FBStandardEventType, FBNonStandardEventType } from '../types'

export const fieldDependencies: Record<string, (FBStandardEventType | FBNonStandardEventType)[]> = {
  custom_event_name: ['CustomEvent'],
  content_category: ['PageView', 'ViewContent', 'Search'],
  content_ids: [
    'AddPaymentInfo',
    'AddToCart',
    'AddToWishlist',
    'InitiateCheckout',
    'Purchase',
    'Search',
    'ViewContent'
  ],
  content_name: ['PageView', 'ViewContent', 'Search'],
  content_type: ['AddToCart', 'Purchase', 'Search', 'ViewContent'],
  contents: ['AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'InitiateCheckout', 'Purchase', 'Search', 'ViewContent'],
  currency: [
    'AddPaymentInfo',
    'AddToCart',
    'AddToWishlist',
    'CompleteRegistration',
    'InitiateCheckout',
    'Lead',
    'Purchase',
    'Search',
    'StartTrial',
    'Subscribe',
    'ViewContent'
  ],
  delivery_category: ['Purchase', 'InitiateCheckout'],
  num_items: ['InitiateCheckout'],
  predicted_ltv: ['Purchase', 'Subscribe', 'StartTrial', 'CompleteRegistration', 'AddPaymentInfo', 'CustomEvent'],
  net_revenue: ['Purchase'],
  search_string: ['Search'],
  status: ['CompleteRegistration'],
  value: [
    'AddPaymentInfo',
    'AddToCart',
    'AddToWishlist',
    'CompleteRegistration',
    'InitiateCheckout',
    'Lead',
    'Purchase',
    'Search',
    'StartTrial',
    'Subscribe',
    'ViewContent'
  ]
}

export function getDependenciesFor(fieldName: string): DependsOnConditions {
  const conditions: Condition[] = [
    {
      fieldKey: 'event_config.show_fields',
      operator: 'is',
      value: 'true'
    }
  ]

  const dependencies = fieldDependencies[fieldName]

  if (Array.isArray(dependencies) && dependencies.length > 1) {
    dependencies.forEach((dep) => {
      conditions.push({
        fieldKey: 'event_config.event_name',
        operator: 'is',
        value: dep
      })
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
