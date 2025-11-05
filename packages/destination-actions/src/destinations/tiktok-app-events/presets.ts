import { defaultValues, Preset } from '@segment/actions-core'
import reportAppEvent from './reportAppEvent'
import { APP_STANDARD_EVENTS, PRODUCT_MAPPING_TYPE } from './constants'

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

export const presets: Preset[] = APP_STANDARD_EVENTS.map((e) => {
  return {
     type: 'automatic',
     partnerAction: 'reportAppEvent',
     name: e.description,
     subscribe: `event = "${e.segmentEventName}"`,
     mapping: {
      ...defaultValues(reportAppEvent.fields),
      event: e.fieldValue,
      ...(e.productMappingType === PRODUCT_MAPPING_TYPE.SINGLE
        ? singleProductContents
        : e.productMappingType === PRODUCT_MAPPING_TYPE.MULTI
        ? multiProductContents
        : {})
     }
  }
})