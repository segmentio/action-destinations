import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import trackOfflineConversion from './trackOfflineConversion'

const productProperties = {
  price: {
    '@path': '$.price'
  },
  quantity: {
    '@path': '$.quantity'
  },
  content_type: {
    '@path': '$.category'
  },
  content_id: {
    '@path': '$.product_id'
  }
}

const singleProductContents = {
  ...defaultValues(trackOfflineConversion.fields),
  contents: {
    '@arrayPath': [
      '$.properties',
      {
        ...productProperties
      }
    ]
  }
}

const multiProductContents = {
  ...defaultValues(trackOfflineConversion.fields),
  contents: {
    '@arrayPath': [
      '$.properties.products',
      {
        ...productProperties
      }
    ]
  }
}

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Complete Payment',
    subscribe: 'event = "Complete Payment"',
    partnerAction: 'trackOfflineConversion',
    mapping: {
      ...singleProductContents,
      event: 'CompletePayment'
    }
  },
  {
    name: 'Contact',
    subscribe: 'event = "Contact"',
    partnerAction: 'trackOfflineConversion',
    mapping: {
      ...singleProductContents,
      event: 'Contact'
    }
  },
  {
    name: 'Subscribe',
    subscribe: 'event = "Subscribe"',
    partnerAction: 'trackOfflineConversion',
    mapping: {
      ...singleProductContents,
      event: 'Subscribe'
    }
  },
  {
    name: 'Submit Form',
    subscribe: 'event = "Submit Form"',
    partnerAction: 'trackOfflineConversion',
    mapping: {
      ...singleProductContents,
      event: 'SubmitForm'
    }
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Tiktok Offline Conversions',
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
      headers: { 'Access-Token': settings.accessToken }
    }
  },
  presets,
  actions: {
    trackOfflineConversion
  }
}

export default destination
