import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import reportAppEvent from './reportAppEvent'
import { STANDARD_EVENTS, PRODUCT_MAPPING_TYPE } from './reportAppEvent/fields/common_fields'

const productProperties = {
  price: {
    '@path': '$.price'
  },
  quantity: {
    '@path': '$.quantity'
  },
  content_category: {
    '@path': '$.category'
  },
  content_id: {
    '@path': '$.product_id'
  },
  content_name: {
    '@path': '$.name'
  },
  brand: {
    '@path': '$.brand'
  }
}

const singleProductContents = {
  ...defaultValues(reportAppEvent.fields),
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
  ...defaultValues(reportAppEvent.fields),
  contents: {
    '@arrayPath': [
      '$.properties.products',
      {
        ...productProperties
      }
    ]
  }
}

const destination: DestinationDefinition<Settings> = {
  name: 'TikTok App Events',
  slug: 'tiktok-app-events',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Access Token',
        description:
          'Your TikTok Access Token. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to generate an access token via the TikTok Ads Manager or API.',
        type: 'password',
        required: true
      }, 
      appID: {
        label: 'TikTok App ID',
        type: 'string',
        description:
          'Your TikTok App ID. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to find this value.',
        required: true
      }
    },
    testAuthentication: (_ ) => {
      // // Return a request that tests/validates the user's credentials.
      // // Send a blank event to events API.
      // return request('https://business-api.tiktok.com/open_api/v1.3/pixel/track/', {
      //   method: 'post',
      //   json: {
      //     event: 'Test Event',
      //     timestamp: '',
      //     context: {}
      //   }
      // })
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
  presets: STANDARD_EVENTS.map(
    ([, fieldValue, description, segmentEventName, productMappingType]) => ({
      type: 'automatic',
      partnerAction: 'reportAppEvent',
      name: description,
      subscribe: `event = "${segmentEventName}"`,
      mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: fieldValue,
        ...(productMappingType === PRODUCT_MAPPING_TYPE.SINGLE
        ? singleProductContents
        : productMappingType === PRODUCT_MAPPING_TYPE.MULTIPLE
        ? multiProductContents
        : {})
      }
    })
  ),
  actions: {
    reportAppEvent
  }
}

export default destination
