import { defaultValues, DestinationDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { Batch, DeleteUser, RecombeeApiClient } from './recombeeApiClient'

import addBookmark from './addBookmark'
import addCartAddition from './addCartAddition'
import addDetailView from './addDetailView'
import addPurchase from './addPurchase'
import addRating from './addRating'
import deleteCartAddition from './deleteCartAddition'
import mergeUsers from './mergeUsers'
import setViewPortion from './setViewPortion'
import setViewPortionFromWatchTime from './setViewPortionFromWatchTime'
import deleteBookmark from './deleteBookmark'
import { ecommerceIdMapping, videoIdMapping } from './commonFields'

const destination: DestinationDefinition<Settings> = {
  name: 'Recombee',
  slug: 'actions-recombee',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      databaseId: {
        label: 'Database ID',
        description: 'The ID of the Recombee Database into which the interactions will be sent.',
        type: 'string',
        required: true
      },
      privateToken: {
        label: 'Private Token',
        description: 'The private token for the Recombee Database used.',
        type: 'password',
        required: true
      },
      databaseRegion: {
        label: 'Database Region',
        description:
          'The Recombee cluster where your Database is located. [Learn more](https://docs.recombee.com/regions)',
        type: 'string',
        required: true,
        format: 'hostname',
        default: 'eu-west',
        choices: [
          { value: 'eu-west', label: 'EU' },
          { value: 'ca-east', label: 'Canada (East Coast)' },
          { value: 'ap-se', label: 'Australia' },
          { value: 'us-west', label: 'US (West Coast)' },
          { value: 'custom', label: 'Custom' }
        ]
      },
      apiUri: {
        label: 'API URI',
        description:
          'URI of the Recombee API that should be used. *Keep this field empty unless you are calling the Recombee cluster based in a specific region or you were assigned a custom URI by the Recombee Support team.*',
        type: 'string',
        required: false,
        depends_on: {
          conditions: [
            {
              fieldKey: 'databaseRegion',
              operator: 'is',
              value: 'custom'
            }
          ]
        }
      }
    },
    testAuthentication: (request: RequestClient, { settings }) => {
      const client = new RecombeeApiClient(settings, request)
      return client.send(new Batch([]))
    }
  },

  presets: [
    {
      name: 'Page - Viewed',
      subscribe: 'type = "page"',
      partnerAction: 'addDetailView',
      mapping: {
        ...defaultValues(addDetailView.fields),
        itemId: { '@path': '$.name' }
      },
      type: 'automatic'
    },
    {
      name: 'Track - Ecommerce - Product Viewed',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'addDetailView',
      mapping: {
        ...defaultValues(addDetailView.fields),
        ...ecommerceIdMapping
      },
      type: 'automatic'
    },
    {
      name: 'Track - Ecommerce - Product Added',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'addCartAddition',
      mapping: defaultValues(addCartAddition.fields),
      type: 'automatic'
    },
    {
      name: 'Track - Ecommerce - Product Removed',
      subscribe: 'type = "track" and event = "Product Removed"',
      partnerAction: 'deleteCartAddition',
      mapping: {
        ...defaultValues(deleteCartAddition.fields),
        ...ecommerceIdMapping
      },
      type: 'automatic'
    },
    {
      name: 'Track - Ecommerce - Order Completed',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'addPurchase',
      mapping: defaultValues(addPurchase.fields),
      type: 'automatic'
    },
    {
      name: 'Track - Ecommerce - Product Added to Wishlist',
      subscribe: 'type = "track" and event = "Product Added to Wishlist"',
      partnerAction: 'addBookmark',
      mapping: {
        ...defaultValues(addBookmark.fields),
        ...ecommerceIdMapping
      },
      type: 'automatic'
    },
    {
      name: 'Track - Ecommerce - Product Removed from Wishlist',
      subscribe: 'type = "track" and event = "Product Removed from Wishlist"',
      partnerAction: 'deleteBookmark',
      mapping: {
        ...defaultValues(deleteBookmark.fields),
        ...ecommerceIdMapping
      },
      type: 'automatic'
    },
    {
      name: 'Track - Ecommerce - Product Shared',
      subscribe: 'type = "track" and event = "Product Shared"',
      partnerAction: 'addBookmark',
      mapping: {
        ...defaultValues(addBookmark.fields),
        ...ecommerceIdMapping
      },
      type: 'automatic'
    },
    {
      name: 'Track - Video - Video Playback Started',
      subscribe: 'type = "track" and event = "Video Playback Started"',
      partnerAction: 'setViewPortion',
      mapping: {
        ...defaultValues(setViewPortion.fields),
        ...videoIdMapping,
        portion: 0
      },
      type: 'automatic'
    },
    {
      name: 'Track - Video - Video Content Playing',
      subscribe: 'type = "track" and event = "Video Content Playing"',
      partnerAction: 'setViewPortionFromWatchTime',
      mapping: {
        ...defaultValues(setViewPortionFromWatchTime.fields),
        ...videoIdMapping
      },
      type: 'automatic'
    },
    {
      name: 'Track - Video - Video Playback Paused',
      subscribe: 'type = "track" and event = "Video Playback Paused"',
      partnerAction: 'setViewPortionFromWatchTime',
      mapping: {
        ...defaultValues(setViewPortionFromWatchTime.fields),
        itemId: { '@path': '$.properties.content_asset_id' }
      },
      type: 'automatic'
    },
    {
      name: 'Track - Video - Video Playback Completed',
      subscribe: 'type = "track" and event = "Video Playback Completed"',
      partnerAction: 'setViewPortion',
      mapping: {
        ...defaultValues(setViewPortion.fields),
        ...videoIdMapping,
        portion: 1
      },
      type: 'automatic'
    },
    {
      name: 'Screen - Viewed',
      subscribe: 'type = "screen"',
      partnerAction: 'addDetailView',
      mapping: {
        ...defaultValues(addDetailView.fields),
        itemId: { '@path': '$.name' }
      },
      type: 'automatic'
    },
    {
      name: 'Alias',
      subscribe: 'type = "alias"',
      partnerAction: 'mergeUsers',
      mapping: defaultValues(mergeUsers.fields),
      type: 'automatic'
    }
  ],

  onDelete: async (request: RequestClient, { settings, payload }) => {
    if (!payload.userId) return
    const client = new RecombeeApiClient(settings, request)
    return client.send(new DeleteUser(payload.userId))
  },

  actions: {
    addBookmark,
    addCartAddition,
    addDetailView,
    addPurchase,
    addRating,
    deleteBookmark,
    deleteCartAddition,
    mergeUsers,
    setViewPortion,
    setViewPortionFromWatchTime
  }
}

export default destination
