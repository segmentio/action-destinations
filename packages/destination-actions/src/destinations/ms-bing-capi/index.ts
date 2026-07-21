import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Microsoft Bing CAPI (Actions)',
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
        description:
          'Your Bing API Token. API token generation is not generally available. To obtain one, you’ll need to contact Microsoft Support, or alternatively, you can [fill out this form](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbRwMZAe0PcMxHmZ0AjDaNRmxUM0o5UURRVktCRkxHNEFLTVNYQjI3NDNBUS4u) to request access.',
        type: 'password',
        required: true
      },
      adStorageConsent: {
        label: 'Ad Storage Consent',
        description: 'Ad Storage Consent for GDPR compliance',
        type: 'string',
        choices: [
          { label: 'Granted', value: 'G' },
          { label: 'Denied', value: 'D' }
        ],
        default: 'G',
        required: false
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
      name: 'Microsoft Bing CAPI msclkid Plugin',
      subscribe: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
      partnerAction: 'msclkidPlugin',
      mapping: {},
      type: 'automatic'
    },
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
      subscribe:
        'type = "track" and event != "Order Completed" and event != "Add to Cart" and event != "Products Searched"',
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
