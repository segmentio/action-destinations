import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { CJ } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, CJ, Payload> = {
  title: 'Site Page',
  description: '',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    userId: {
      label: 'User ID',
      description: 'A unique ID assigned by you to the user.',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    enterpriseId: {
      label: 'Enterprise ID',
      description: 'Your CJ Enterprise ID.',
      type: 'number',
      required: true
    },
    pageType: {
      label: 'Page Type',
      description: 'Page type to be sent to CJ.',
      type: 'string',
      choices: [
        { label: 'Account Center', value: 'accountCenter' },
        { label: 'Account Signup', value: 'accountSignup' },
        { label: 'Application Start', value: 'applicationStart' },
        { label: 'Branch Locator', value: 'branchLocator' },
        { label: 'Cart', value: 'cart' },
        { label: 'Category', value: 'category' },
        { label: 'Conversion Confirmation', value: 'conversionConfirmation' },
        { label: 'Department', value: 'department' },
        { label: 'Homepage', value: 'homepage' },
        { label: 'Information', value: 'information' },
        { label: 'Product Detail', value: 'productDetail' },
        { label: 'Property Detail', value: 'propertyDetail' },
        { label: 'Property Results', value: 'propertyResults' },
        { label: 'Search Results', value: 'searchResults' },
        { label: 'Store Locator', value: 'storeLocator' },
        { label: 'Sub Category', value: 'subCategory' }
      ],
      required: true
    },
    referringChannel: {
      label: 'Referring Channel',
      description: 'The referring channel to be sent to CJ.',
      type: 'string',
      choices: [
        { label: 'Affiliate', value: 'Affiliate' },
        { label: 'Display', value: 'Display' },
        { label: 'Social', value: 'Social' },
        { label: 'Search', value: 'Search' },
        { label: 'Email', value: 'Email' },
        { label: 'Direct Navigation', value: 'Direct_Navigation' }
      ]
    },
    cartSubtotal: {
      label: 'Cart Subtotal',
      description: 'The cart subtotal to be sent to CJ.',
      type: 'number',
      required: false,
    },
    items: {
      label: 'Items',
      description: 'The items to be sent to CJ.',
      type: 'object',
      multiple: true,
      properties: {
        unitPrice: {
          label: 'Unit Price',
          description: 'the price of the item before tax and discount.',
          type: 'number',
          required: true
        },
        itemId: {
          label: 'Item ID', 
          description: 'The item sku.',
          type: 'string',
          required: true
        },
        quantity: {
          label: 'Quantity',
          description: 'The quantity of the item.',
          type: 'number',
          required: true
        },
        discount: {
          label: 'Discount',
          description: 'The discount applied to the item.',
          type: 'number',
          required: false
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            itemPrice: { '@path': '$.price' },
            itemId: { '@path': '$.id' },
            quantity: { '@path': '$.quantity' },
            discount: { '@path': '$.discount' }
          }
        ]
      }
    }
  },
  perform: (cj, { payload }) => {
    const { enterpriseId, pageType, referringChannel, cartSubtotal, items, userId } = payload

    cj.sitePage(
      enterpriseId,
      pageType,
      referringChannel,
      cartSubtotal,
      items,
      userId
    )
  }
}

export default action
