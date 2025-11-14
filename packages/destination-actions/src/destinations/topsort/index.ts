import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'

import type { Settings } from './generated-types'

import impression from './impression'

import impressionsList from './impressionsList'

import click from './click'

import purchase from './purchase'

const destination: DestinationDefinition<Settings> = {
  name: 'Topsort',
  slug: 'actions-topsort',
  mode: 'cloud',
  description: 'Send events server-side to the Topsort Events API.',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Created under Settings > API Integration in the Topsort Manager Platform.',
        type: 'password',
        required: true
      },
      skipZeroPricePurchases: {
        label: 'Skip Zero Price Purchases',
        description:
          'When enabled, purchase events with items that have zero or missing unit price will be filtered out.',
        type: 'boolean',
        required: false,
        default: false
      }
    }
  },
  presets: [
    {
      name: 'Impression',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'impression',
      mapping: defaultValues(impression.fields),
      type: 'automatic'
    },
    {
      name: 'Click',
      subscribe: 'type = "track" and event = "Product Clicked"',
      partnerAction: 'click',
      mapping: defaultValues(click.fields),
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'purchase',
      mapping: defaultValues(purchase.fields),
      type: 'automatic'
    },
    {
      name: 'Impressions List',
      subscribe: 'type = "track" and event = "Product List Viewed"',
      partnerAction: 'impressionsList',
      mapping: defaultValues(impressionsList.fields),
      type: 'automatic'
    },
    {
      name: 'Banner Impression',
      subscribe: 'type = "track" and event = "Banner Impression"',
      partnerAction: 'impression',
      mapping: defaultValues(impression.fields),
      type: 'automatic'
    },
    {
      name: 'Banner Click',
      subscribe: 'type = "track" and event = "Banner Click"',
      partnerAction: 'click',
      mapping: defaultValues(click.fields),
      type: 'automatic'
    }
  ],
  actions: {
    impression,
    impressionsList,
    click,
    purchase
  }
}

export default destination

export function NormalizeDeviceType(t: string | undefined): string | undefined {
  if (t === 'ios' || t === 'android') {
    t = 'mobile'
  }
  if (t === 'macos' || t === 'windows') {
    t = 'desktop'
  }
  // Prevents this field from being automatically filled with a value that fails the validation on the Report Events API
  if (t !== 'mobile' && t !== 'desktop') {
    t = undefined
  }
  return t
}
