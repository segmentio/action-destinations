import { InputField } from '@segment/actions-core/destination-kit/types'

export const dtm_fid: InputField = {
  label: 'Form ID',
  description: 'Form ID used in Epsilon’s system to identify app visits vs. conversions.',
  type: 'string',
  required: true
} 

export const dtm_promo_id: InputField = {
  label: 'Promo ID',
  description: 'Promo ID used in Epsilon’s system to identify the promotion associated with the event.',
  type: 'string',
  default: { '@path': '$.properties.promo_id' }
}

export const dtm_event: InputField = {
  label: 'Event Name',
  description: 'The name of the event to send to Epsilon.',
  type: 'string',
  required: true,
  choices: [
    { label: 'Custom event', value: 'custom' },
    { label: 'First App Open/App Download', value: 'firstOpen' },
    { label: 'App Open', value: 'appOpen' },
    { label: 'Sign in/Create Account', value: 'signIn' },
    { label: 'Shop Department View', value: 'department' },
    { label: 'Shop Category View', value: 'category' },
    { label: 'Shop Subcategory View', value: 'subcategory' },
    { label: 'Shop Product View', value: 'product' },
    { label: 'Add to Favorites', value: 'addFavorites' },
    { label: 'Add to Saved List', value: 'addSavedList' },
    { label: 'Find a Store', value: 'store' },
    { label: 'Reward Signup', value: 'rewardSignup' },
    { label: 'Add to Cart', value: 'cart' },
    { label: 'Transaction Complete', value: 'conversion' }
  ]
}

export const customEventName: InputField = {
  label: 'Custom Event Name',
  description: 'The name of the custom event to send to Epsilon.',
  type: 'string',
  default: { '@path': '$.event' },
  required: {
    conditions: [{ fieldKey: 'dtm_event', operator: 'is', value: 'custom' }]
  },
  depends_on: {
    conditions: [
      {
        fieldKey: 'dtm_event',
        operator: 'is',
        value: 'custom'
      }
    ]
  }
}

export const identifiers: InputField = {
  label: 'Identifiers',
  description: 'Unique identifiers for the user.',
  type: 'object',
  required: true,
  properties: {
    deviceID: {
      label: 'Device ID',
      description: 'Mobile Device ID (IDFV or Google App Set ID).',
      type: 'string',
      default: { '@path': '$.context.device.id' }
    },
    advertisingId: {
      label: 'Advertising ID',
      description: 'Mobile Ad ID (IDFA or Google Add ID).',
      type: 'string',
      default: { '@path': '$.context.device.advertisingId' }
    },
    dtm_user_agent: {
      label: 'User Agent',
      description: 'User agent of the mobile device.',
      type: 'string',
      default: { '@path': '$.context.userAgent' }
    },
    dtm_user_ip: {
      label: 'IP Address',
      description: 'IP address of the user.',
      type: 'string',
      default: { '@path': '$.context.ip' }
    },
    dtm_email_hash: {
      label: 'Email address',
      description: 'Accepts hashed or unhashed emails. Segment will ensure that a non hashed email is hashed before being sent to Epsilon',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    dtm_mobile_hash: {
      label: 'Mobile Hash',
      description: 'Accepts hashed or unhashed mobile numbers. Segment will ensure that a non hashed mobile number is hashed before being sent to Epsilon',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    dtm_user_id: {
      label: 'User ID',
      description: 'Unique identifier for the user.',
      type: 'string',
      default: { '@path': '$.userId' }
    },

  }
}

export const dtmc_department: InputField = {
  label: 'Department',
  description: 'Department of the product.',
  type: 'string',
  default: { '@path': '$.properties.department' },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'department', 'category', 'subcategory', 'product', 'addFavorites', 'addSavedList', 'cart']
    }]
  }
}

export const dtmc_category: InputField = {
  label: 'Category',
  description: 'Category of the product.',
  type: 'string',
  default: { '@path': '$.properties.category' },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'category', 'subcategory', 'product', 'addFavorites', 'addSavedList', 'cart']
    }]
  }
}

export const dtmc_sub_category: InputField = {
  label: 'Sub Category',
  description: 'Sub-category of the product.',
  type: 'string',
  default: { '@path': '$.properties.sub_category' },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'subcategory', 'product', 'addFavorites', 'addSavedList', 'cart']
    }]
  }
}

export const dtmc_product_id: InputField = {
  label: 'Product ID',  
  description: 'Unique identifier for the product',
  type: 'string',
  default: { '@path': '$.properties.product_id' },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'product', 'addFavorites', 'addSavedList', 'cart']
    }]
  }
}

export const dtmc_brand: InputField = {
  label: 'Brand',
  description: 'Brand of the product.',
  type: 'string',
  default: { '@path': '$.properties.brand' },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'product', 'addFavorites', 'addSavedList', 'cart']
    }]
  }
}

export const dtmc_upc: InputField = {
  label: 'Universal Product Code',
  description: 'Manufacturer Universal Product Code for the product.',
  type: 'string',
  default: { '@path': '$.properties.upc' },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'product', 'addFavorites', 'addSavedList', 'cart']
    }]
  }
}

export const dtmc_mpn: InputField = {
  label: 'Manufacturer Model Part Number',
  description: 'Manufacturer Model Part Number for the product.',
  type: 'string',
  default: { '@path': '$.properties.mpn' },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'product', 'addFavorites', 'addSavedList', 'cart']
    }]
  }
}

export const dtmc_transaction_id: InputField = {
  label: 'Transaction ID',
  description: 'Unique identifier for the transaction.',
  type: 'string',
  required: true,
  default: { '@path': '$.properties.order_id' },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'conversion']
    }]
  }
}

export const dtm_conv_val: InputField = {
  label: 'Conversion Value',
  description: 'Contains the total purchase price in decimal format. Do not include any tax or shipping costs.',
  type: 'number',
  default: { '@path': '$.properties.total' },
  required: {
    conditions: [{ fieldKey: 'dtm_event', operator: 'is', value: 'conversion' }]
  },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'conversion']
    }]
  }
}

export const dtm_items : InputField = {
  label: 'Items Purchased',
  description: 'An array of all items in the conversion.',
  type: 'object', 
  multiple: true,
  required: true,
  additionalProperties: true,
  properties: {
      product_id: {
        label: 'Product ID',
        description: 'Unique identifier / SKU for the product.',
        type: 'string',
        required: true
      },
      item_amount: {
        label: 'Item Amount',
        description: 'Unit cost / price for 1 unit of the item.',
        type: 'number',
        required: true
      },
      item_quantity: {
        label: 'Item Quantity',
        description: 'number of SKU items in the transaction.',
        type: 'integer',
        required: true
      },
      item_discount: {
        label: 'Item Discount',
        description: 'Discount value from the original amount.',
        type: 'number'
      }
  },
  default: {
    '@arrayPath': [
      '$.properties.products', {
        productId: { '@path': '$.product_id' },
        price: { '@path': '$.price' },
        quantity: { '@path': '$.quantity' },
        category: { '@path': '$.discount' }
      }
    ]
  },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'conversion']
    }]
  }
}

export const dtm_conv_curr: InputField = {
  label: 'Currency',
  description: 'Currency of the transaction. Use ISO 4217 currency codes (e.g., USD, EUR).',
  type: 'string',
  default: { '@path': '$.properties.currency' },
  required: {
    conditions: [{ fieldKey: 'dtm_event', operator: 'is', value: 'conversion' }]
  },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'conversion']
    }]
  }
}

export const dtmc_conv_type: InputField = {
  label: 'Order Type',  
  description: 'Differentiate between types of online purchases (Delivery, Pickup, etc.)',
  type: 'string',
  default: { '@path': '$.properties.order_type' },
  required: {
    conditions: [{ fieldKey: 'dtm_event', operator: 'is', value: 'conversion' }]
  },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'conversion']
    }]
  }
}

export const dtmc_conv_store_location: InputField = {
  label: 'Store Location',
  description: 'For Pickup conversions, denote the store location of the pickup.',
  type: 'string',
  default: { '@path': '$.properties.store_location' },
  required: {
    conditions: [{ fieldKey: 'dtm_event', operator: 'is', value: 'conversion' }]
  },
  depends_on: {
    conditions: [
    {
      fieldKey: 'dtm_event',
      operator: 'is',
      value: ['custom', 'conversion']
    }]
  }
}

export const id: InputField = {
  label: 'Cache Buster',
  description: 'Unique identifier for the message. Used for cache busting.',
  type: 'string',
  required: true,
  default: { '@path': '$.messageId' }
}

export const appId: InputField = {
  label: 'App ID / Namespace',
  description: 'The namespace of the Mobile App.',
  type: 'string',
  required: true,
  default: { '@path': '$.context.app.namespace' }
}

export const version: InputField = {
  label: 'App Version',
  description: 'The version of the Mobile App.',
  type: 'string',
  required: true,
  default: { '@path': '$.context.app.version' }
}

export const deviceType: InputField = {
  label: 'Device Type',
  description: 'Type of the device (e.g., iOS, Android).',
  type: 'string',
  required: true,  
  choices: [
    { label: 'iOS', value: 'ios' },
    { label: 'Android', value: 'android' }
  ],
  default: { '@path': '$.context.device.type' }
}

export const standardFields = {
  id, 
  appId,
  dtm_event,
  version, 
  dtm_fid,
  dtm_promo_id,
  identifiers,
  deviceType
}