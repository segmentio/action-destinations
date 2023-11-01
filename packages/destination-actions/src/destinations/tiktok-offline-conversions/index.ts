import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackPaymentOfflineConversion from './trackPaymentOfflineConversion'
import trackNonPaymentOfflineConversion from './trackNonPaymentOfflineConversion'

const destination: DestinationDefinition<Settings> = {
  name: 'TikTok Offline Conversions',
  slug: 'actions-tiktok-offline-conversions',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Access Token',
        description:
          'Your TikTok Access Token. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?rid=mcxl4tclmfa&id=1758051319816193) for information on how to generate an access token via the TikTok Ads Manager or API.',
        type: 'string',
        required: true
      },
      eventSetID: {
        label: 'Event Set ID',
        type: 'string',
        description:
          'Your TikTok Offline Event Set ID. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?rid=mcxl4tclmfa&id=1758051319816193) for information on how to find this value.',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request('https://business-api.tiktok.com/open_api/v1.3/offline/track/', {
        method: 'post',
        json: {
          event_set_id: settings.eventSetID,
          event: 'Test Event',
          timestamp: '',
          context: {}
        }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'Access-Token': settings.accessToken,
        'Content-Type': 'application/json'
      }
    }
  },
  presets: [
    {
      name: 'Complete Payment',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...defaultValues(trackPaymentOfflineConversion.fields),
        event: 'CompletePayment'
      },
      type: 'automatic'
    },
    {
      name: 'Contact',
      subscribe: 'type = "track" and event = "User Contacted Call Center"',
      partnerAction: 'trackNonPaymentOfflineConversion',
      mapping: {
        ...defaultValues(trackNonPaymentOfflineConversion.fields),
        event: 'Contact'
      },
      type: 'automatic'
    },
    {
      name: 'Subscribe',
      subscribe: 'type = "track" and event = "User Subscribed In Store"',
      partnerAction: 'trackNonPaymentOfflineConversion',
      mapping: {
        ...defaultValues(trackNonPaymentOfflineConversion.fields),
        event: 'Subscribe'
      },
      type: 'automatic'
    },
    {
      name: 'Submit Form',
      subscribe: 'type = "track" and event = "Form Submitted"',
      partnerAction: 'trackNonPaymentOfflineConversion',
      mapping: {
        ...defaultValues(trackNonPaymentOfflineConversion.fields),
        event: 'SubmitForm'
      },
      type: 'automatic'
    }
  ],
  actions: {
    trackPaymentOfflineConversion,
    trackNonPaymentOfflineConversion
  }
}

export default destination
