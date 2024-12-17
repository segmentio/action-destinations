import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'

import type { Settings } from './generated-types'

import impression from './impression'

import click from './click'

import purchase from './purchase'

import bannerImpression from './bannerImpression'

import bannerClick from './bannerClick'

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
      name: 'Banner Impression',
      subscribe: 'type = "track" and event = "Banner Viewed"',
      partnerAction: 'bannerImpression',
      mapping: defaultValues(bannerImpression.fields),
      type: 'automatic'
    },
    {
      name: 'Banner Click',
      subscribe: 'type = "track" and event = "Banner Clicked"',
      partnerAction: 'bannerClick',
      mapping: defaultValues(bannerClick.fields),
      type: 'automatic'
    }
  ],
  actions: {
    impression,
    click,
    purchase,
    bannerImpression,
    bannerClick
  }
}

export default destination
