import { InputField } from '@segment/actions-core'

export function priceFields(valueSource = 'value'): Record<string, InputField> {
  return {
    value: {
      label: 'Value',
      description: 'The monetary value of this event, in the specified currency',
      type: 'number',
      default: { '@path': `$.properties.${valueSource}` },
      required: true
    },
    currency: {
      label: 'Currency',
      description: 'ISO 4217 three-digit currency code (e.g., "USD", "CAD", "AUD")',
      type: 'string',
      default: { '@path': '$.properties.currency' },
      required: true
    }
  }
}

export const lineItemFields: Record<string, InputField> = {
  productId: {
    label: 'Product ID',
    description: 'Your unique ID for this product',
    type: 'string',
    default: { '@path': '$.properties.product_id' },
    required: false
  },
  productName: {
    label: 'Product name',
    description: 'The name of this product',
    type: 'string',
    default: { '@path': '$.properties.name' },
    required: false
  },
  productType: {
    label: 'Product type',
    description: 'The type or category of this product',
    type: 'string',
    default: { '@path': '$.properties.category' },
    required: false
  },
  productVendor: {
    label: 'Vendor',
    description: 'The vendor or brand for this product',
    type: 'string',
    default: { '@path': '$.properties.brand' },
    required: false
  },
  variantId: {
    label: 'Variant ID',
    description: 'The unique ID for this variant of the product',
    type: 'string',
    default: { '@path': '$.properties.variant_id' },
    required: false
  },
  variantName: {
    label: 'Variant name',
    description: 'The name of this variant of the product',
    type: 'string',
    default: { '@path': '$.properties.variant' },
    required: false
  }
}

export const productFields: Record<string, InputField> = {
  ...priceFields('price'),
  ...lineItemFields
}

export const orderInfoFields: Record<string, InputField> = {
  discountCode: {
    label: 'Discount code',
    description: 'The coupon or discount code applied to the cart',
    type: 'string',
    default: { '@path': '$.properties.coupon' },
    required: false
  },
  id: {
    label: 'Order ID',
    description: 'The unique ID for the order initiated by this checkout event',
    type: 'string',
    default: { '@path': '$.properties.order_id' },
    required: false
  },
  quantity: {
    label: 'Quantity',
    description: 'The total number of items in the cart',
    type: 'number',
    required: false
  },
  lineItems: {
    label: 'Line items',
    description: 'The list (array) of all products in the cart',
    type: 'object',
    multiple: true,
    properties: {
      quantity: {
        label: 'Quantity',
        description: 'The number of this product in the cart',
        type: 'number',
        required: false
      },
      value: {
        label: 'Price',
        description: 'The price per unit of this product',
        type: 'number',
        required: false
      },
      productId: {
        label: 'Product ID',
        description: 'Your unique ID for this product',
        type: 'string',
        required: false
      },
      productName: {
        label: 'Product name',
        description: 'The name of this product',
        type: 'string',
        required: false
      },
      productType: {
        label: 'Product type',
        description: 'The type or category of this product',
        type: 'string',
        required: false
      },
      productVendor: {
        label: 'Vendor',
        description: 'The vendor or brand for this product',
        type: 'string',
        required: false
      },
      variantId: {
        label: 'Variant ID',
        description: 'The unique ID for this variant of the product',
        type: 'string',
        required: false
      },
      variantName: {
        label: 'Variant name',
        description: 'The name of this variant of the product',
        type: 'string',
        required: false
      }
    },
    default: {
      '@arrayPath': [
        '$.properties.products',
        {
          quantity: { '@path': '$.quantity' },
          value: { '@path': '$.price' },
          productId: { '@path': '$.product_id' },
          productName: { '@path': '$.name' },
          productType: { '@path': '$.category' },
          productVendor: { '@path': '$.brand' },
          variantId: { '@path': '$.variant_id' },
          variantName: { '@path': '$.variant' }
        }
      ]
    },
    required: false
  }
}

export const mobileFields: Record<string, InputField> = {
  host: {
    label: 'MMP Host',
    description: 'The name of the MMP platform transmitting this event to Segment (e.g., Appsflyer, Singular, etc.)',
    type: 'string',
    default: 'segment',
    required: true
  },
  app: {
    label: 'App name',
    description: 'The name of the mobile application',
    type: 'string',
    default: { '@path': '$.context.app.name' },
    required: true
  },
  ip: {
    label: 'IP address',
    description:
      'The IPv4 address of the end user who installed the app (Note: Segment does not support collecting IPv6 addresses)',
    type: 'string',
    format: 'ipv4',
    default: { '@path': '$.context.ip' },
    required: true
  },
  ua: {
    label: 'User agent',
    description: 'The user agent of the end user who installed the app (Note: not sent by the iOS Segment agent)',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.context.userAgent' },
        then: { '@path': '$.context.userAgent' },
        else: { '@path': '$.context.library.name' }
      }
    },
    required: true
  },
  ts: {
    label: 'Timestamp',
    description: 'When the event occurred, in ISO 8601 format',
    type: 'string',
    default: { '@path': '$.timestamp' },
    required: true
  },
  plat: {
    label: 'Mobile platform',
    description: 'The mobile platform of the device (e.g., iOS, Android)',
    type: 'string',
    default: { '@path': '$.context.device.type' },
    required: true
  },
  aifa: {
    label: 'GAID/AIFA',
    description: 'The Google Advertising ID, on Android devices',
    type: 'string',
    default: { '@path': '$.context.device.advertisingId' },
    required: false
  },
  andi: {
    label: 'AID/ANDI',
    description: 'The Android ID, on Android devices',
    type: 'string',
    default: { '@path': '$.context.device.id' },
    required: false
  },
  idfa: {
    label: 'IDFA',
    description: 'The ID for Advertising, on iOS devices',
    type: 'string',
    default: { '@path': '$.context.device.advertisingId' },
    required: false
  },
  idfv: {
    label: 'IDFV',
    description: 'The ID for Vendors, on iOS devices',
    type: 'string',
    default: { '@path': '$.context.device.id' },
    required: false
  }
}
