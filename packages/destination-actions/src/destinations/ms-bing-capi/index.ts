import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'
import { send } from '../amazon-eventbridge/send/functions'
import { eventType } from '../attentive/fields'

const destination: DestinationDefinition<Settings> = {
  name: 'Ms Bing Capi',
  slug: 'actions-ms-bing-capi',
  mode: 'cloud',
  authentication: {
    scheme: 'basic',
    fields: {
      UetTag: {
        label: 'Bing UetTag',
        description: 'Your Bing UetTag.',
        type: 'string',
        required: true
      },
      ApiToken: {
        label: 'Bing ApiToken',
        description: 'Your Bing API Token.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (_, { settings }) => {
      // TODO: see if there's any API call which can be made to check if the credentials are valid
      if (settings.UetTag.length && settings.ApiToken.length) {
        return true
      } else {
        throw new Error('Invalid UetTag or ApiToken')
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        Authorization: `Bearer ${settings.ApiToken}`,
        'Content-Type': 'application/json'
      }
    }
  },
  presets: [
    {
      name: 'Send Purchase Event',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'sendEvent',
      mapping: defaultValues({
        ...sendEvent.fields,
        customData: {
          ...sendEvent.fields.customData,
          eventType: 'purchase'
        }
      }),
      type: 'automatic'
    },
    {
      name: 'Send Cart Event',
      subscribe: 'type = "track" and event = "Add to Cart"',
      partnerAction: 'sendEvent',
      mapping: defaultValues({
        ...sendEvent.fields,
        customData: {
          ...sendEvent.fields.customData,
          eventType: 'cart'
        }
      }),
      type: 'automatic'
    },
    {
      name: 'Send Search Results',
      subscribe: 'type = "track" and event = "Products Searched"',
      partnerAction: 'sendEvent',
      mapping: defaultValues({
        ...sendEvent.fields,
        customData: {
          ...sendEvent.fields.customData,
          eventType: 'searchresults'
        }
      }),
      type: 'automatic'
    },
    {
      name: 'Send Custom Event',
      subscribe: 'type = "track"',
      partnerAction: 'sendEvent',
      mapping: defaultValues(sendEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Send Pageload',
      subscribe: 'type = "page"',
      partnerAction: 'sendEvent',
      mapping: defaultValues({
        ...sendEvent.fields,
        data: {
          ...sendEvent.fields.data,
          eventType: 'pageLoad' 
        }
      }),
      type: 'automatic'
    }
  ],
  actions: {
    sendEvent
  }
}

export default destination
