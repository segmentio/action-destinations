import { InputField } from '@segment/actions-core/destination-kit/types'

export const event_metadata: InputField = {
    label: 'Event Metadata',
    description: 'The metadata associated with the conversion event. Only one of "value" or "value_decimal" should be included.',
    type: 'object',
    properties: {
        event_metadata: {
            label: 'Event Metadata',
            description: 'The metadata associated with the conversion event. Only one of "value" or "value_decimal" should be included.',
            type: 'object',
            properties: {
                currency: {
                    label: 'Currency',
                    description: 'The currency for the value provided. This must be a three-character ISO 4217 currency code. This should only be set for revenue-related events.',
                    type: 'string'
                },
                item_count: {
                    label: 'Item Count',
                    description: 'The number of items in the event. This should only be set for revenue-related events.',
                    type: 'integer'
                },
                products: {
                    label: 'Products',
                    description: 'An array of products associated with the event.',
                    type: 'object',
                    multiple: true,
                    properties: {
                        category: {
                            label: 'Category',
                            description: 'The category the product is in; for example, a label from Google\'s product taxonomy. Required.',
                            type: 'string'
                        },
                        id: {
                            label: 'Product ID',
                            description: 'The ID representing the product in a catalog. Required.',
                            type: 'string'
                        },
                        name: {
                            label: 'Product Name',
                            description: 'The name of the product. Optional.',
                            type: 'string'
                        }
                    }
                },
                value: {
                    label: 'Value',
                    description: 'The value of the transaction in the smallest subunit of the currency. For example, pennies, cents, centavos, paise, and satoshis for USD, EUR, MXN, INR, and BTC respectively. This should only be set for revenue-related events.',
                    type: 'integer'
                },
                value_decimal: {
                    label: 'Value Decimal',
                    description: 'The value of the transaction in the base unit of the currency. For example, dollars, euros, pesos, rupees, and bitcoin for USD, EUR, MXN, INR, and BTC respectively. This should only be set for revenue-related events.',
                    type: 'number'
                }
            }
        }
    }
}