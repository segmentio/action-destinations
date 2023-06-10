import { InputField } from '@segment/actions-core/destination-kit/types'

export const formatUserProperties = (userProperties: object | undefined): object | undefined => {
  if (!userProperties) {
    return undefined
  }

  let properties = {}

  Object.entries(userProperties).forEach(([key, value]) => {
    properties = { ...properties, ...{ [key]: { value: value } } }
  })

  return { user_properties: properties }
}

export const user_properties: InputField = {
  label: 'User Properties',
  description:
    'The user properties to send to Google Analytics 4. You must create user-scoped dimensions to ensure custom properties are picked up by Google. See Google’s [Custom user properties](https://support.google.com/analytics/answer/9269570) to learn how to set and register user properties. ',
  type: 'object',
  additionalProperties: true,
  defaultObjectUI: 'keyvalue'
}

export const params: InputField = {
  label: 'Event Parameters',
  description: 'The event parameters to send to Google Analytics 4.',
  type: 'object',
  additionalProperties: true,
  defaultObjectUI: 'keyvalue'
}
export const user_id: InputField = {
  label: 'User ID',
  type: 'string',
  description:
    "A unique identifier for a user. See Google's [User-ID for cross-platform analysis](https://support.google.com/analytics/answer/9213390) and [Reporting: deduplicate user counts](https://support.google.com/analytics/answer/9355949?hl=en) documentation for more information on this identifier."
}

export const promotion_id: InputField = {
  label: 'Promotion ID',
  type: 'string',
  description: 'The ID of the promotion associated with the event.'
}

export const promotion_name: InputField = {
  label: 'Promotion Name',
  type: 'string',
  description: 'The name of the promotion associated with the event.'
}

export const creative_slot: InputField = {
  label: 'Creative Slot',
  type: 'string',
  description: 'The name of the promotional creative slot associated with the event.'
}

export const creative_name: InputField = {
  label: 'Creative Name',
  type: 'string',
  description: 'The name of the promotional creative.'
}

export const tax: InputField = {
  label: 'Tax',
  type: 'number',
  description: 'Total tax associated with the transaction.',
  default: {
    '@path': '$.properties.tax'
  }
}

export const shipping: InputField = {
  label: 'Shipping',
  type: 'number',
  description: 'Shipping cost associated with the transaction.',
  default: {
    '@path': '$.properties.shipping'
  }
}

export const transaction_id: InputField = {
  label: 'Order Id',
  type: 'string',
  description: 'The unique identifier of a transaction.',
  default: {
    '@path': '$.properties.order_id'
  }
}

export const affiliation: InputField = {
  label: 'Affiliation',
  type: 'string',
  description: 'Store or affiliation from which this transaction occurred (e.g. Google Store).',
  default: {
    '@path': '$.properties.affiliation'
  }
}

export const client_id: InputField = {
  label: 'Client ID',
  description: 'Uniquely identifies a user instance of a web client.',
  type: 'string',
  required: true,
  default: {
    '@if': {
      exists: { '@path': '$.userId' },
      then: { '@path': '$.userId' },
      else: { '@path': '$.anonymousId' }
    }
  }
}

export const currency: InputField = {
  label: 'Currency',
  type: 'string',
  description: 'Currency of the items associated with the event, in 3-letter ISO 4217 format.',
  default: { '@path': '$.properties.currency' }
}

export const value: InputField = {
  label: 'Value',
  type: 'number',
  description: 'The monetary value of the event.',
  default: {
    '@path': '$.properties.value'
  }
}

export const coupon: InputField = {
  label: 'Coupon',
  type: 'string',
  description: 'Coupon code used for a purchase.'
}

export const payment_type: InputField = {
  label: 'Payment Type',
  type: 'string',
  description: 'The chosen method of payment.',
  default: {
    '@path': '$.properties.payment_method'
  }
}

export const method: InputField = {
  label: 'Method',
  type: 'string',
  description: 'The method used to login.',
  default: {
    '@path': '$.properties.method'
  }
}

export const search_term: InputField = {
  label: 'Search Term',
  type: 'string',
  description: 'The term that was searched for.',
  default: {
    '@path': `$.properties.query`
  }
}

export const item_list_name: InputField = {
  label: 'Item List Name',
  description: 'The name of the list in which the item was presented to the user.',
  type: 'string',
  default: {
    '@path': `$.properties.item_list_name`
  }
}
export const item_list_id: InputField = {
  label: 'Item List Id',
  description: 'The ID of the list in which the item was presented to the user.',
  type: 'string',
  default: {
    '@path': `$.properties.item_list_id`
  }
}
export const location_id: InputField = {
  label: 'Location ID',
  type: 'string',
  description: 'The ID of the location.',
  default: {
    '@path': '$.properties.position'
  }
}

export const minimal_items: InputField = {
  label: 'Products',
  description: 'The list of products purchased.',
  type: 'object',
  multiple: true,
  properties: {
    item_id: {
      label: 'Product ID',
      type: 'string',
      description: 'Identifier for the product being purchased.'
    },
    item_name: {
      label: 'Name',
      type: 'string',
      description: 'Name of the product being purchased.'
    },
    affiliation: {
      label: 'Affiliation',
      type: 'string',
      description: 'A product affiliation to designate a supplying company or brick and mortar store location.'
    },
    coupon: {
      label: 'Coupon',
      type: 'string',
      description: 'Coupon code used for a purchase.'
    },
    currency: {
      label: 'Currency',
      type: 'string',
      description: 'Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.'
    },
    discount: {
      label: 'Discount',
      type: 'number',
      description: 'Monetary value of discount associated with a purchase.'
    },
    index: {
      label: 'Index',
      type: 'number',
      description: 'The index/position of the item in a list.'
    },
    item_brand: {
      label: 'Brand',
      type: 'string',
      description: 'Brand associated with the product.'
    },
    item_category: {
      label: 'Category',
      type: 'string',
      description: 'Product category.'
    },
    item_category2: {
      label: 'Category 2',
      type: 'string',
      description: 'Product category 2.'
    },
    item_category3: {
      label: 'Category 3',
      type: 'string',
      description: 'Product category 3.'
    },
    item_category4: {
      label: 'Category 4',
      type: 'string',
      description: 'Product category 4.'
    },
    item_category5: {
      label: 'Category 5',
      type: 'string',
      description: 'Product category 5.'
    },
    item_list_id: {
      label: 'Item List ID',
      type: 'string',
      description: 'The ID of the list in which the item was presented to the user.'
    },
    item_list_name: {
      label: 'Item List Name',
      type: 'string',
      description: 'The name of the list in which the item was presented to the user.'
    },
    item_variant: {
      label: 'Variant',
      type: 'string',
      description: 'Variant of the product (e.g. Black).'
    },
    location_id: {
      label: 'Location ID',
      type: 'string',
      description: 'The location associated with the item.'
    },
    price: {
      label: 'Price',
      type: 'number',
      description: 'Price of the product being purchased, in units of the specified currency parameter.'
    },
    quantity: {
      label: 'Quantity',
      type: 'integer',
      description: 'Item quantity.'
    }
  }
}

export const items_single_products: InputField = {
  ...minimal_items,
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        item_id: {
          '@path': '$.product_id'
        },
        item_name: {
          '@path': '$.name'
        },
        affiliation: {
          '@path': '$.affiliation'
        },
        coupon: {
          '@path': '$.coupon'
        },
        item_brand: {
          '@path': '$.brand'
        },
        item_category: {
          '@path': '$.category'
        },
        item_variant: {
          '@path': '$.variant'
        },
        price: {
          '@path': '$.price'
        },
        quantity: {
          '@path': '$.quantity'
        }
      }
    ]
  }
}
export const items_multi_products: InputField = {
  ...minimal_items,
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        item_id: {
          '@path': '$.product_id'
        },
        item_name: {
          '@path': '$.name'
        },
        affiliation: {
          '@path': '$.affiliation'
        },
        coupon: {
          '@path': '$.coupon'
        },
        index: {
          '@path': '$.position'
        },
        item_brand: {
          '@path': '$.brand'
        },
        item_category: {
          '@path': '$.category'
        },
        item_variant: {
          '@path': '$.variant'
        },
        price: {
          '@path': '$.price'
        },
        quantity: {
          '@path': '$.quantity'
        }
      }
    ]
  }
}
