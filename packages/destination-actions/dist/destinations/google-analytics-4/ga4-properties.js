"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.items_multi_products = exports.items_single_products = exports.minimal_items = exports.payment_type = exports.coupon = exports.value = exports.currency = exports.client_id = exports.affiliation = exports.transaction_id = exports.shipping = exports.tax = exports.creative_name = exports.creative_slot = exports.promotion_name = exports.promotion_id = exports.user_id = exports.params = void 0;
exports.params = {
    label: 'Event Parameters',
    description: 'The event parameters to send to Google',
    type: 'object',
    additionalProperties: true,
    defaultObjectUI: 'keyvalue'
};
exports.user_id = {
    label: 'User ID',
    type: 'string',
    description: "A unique identifier for a user. See Google's [User-ID for cross-platform analysis](https://support.google.com/analytics/answer/9213390) and [Reporting: deduplicate user counts](https://support.google.com/analytics/answer/9355949?hl=en) documentation for more information on this identifier."
};
exports.promotion_id = {
    label: 'Promotion ID',
    type: 'string',
    description: 'The ID of the promotion associated with the event.'
};
exports.promotion_name = {
    label: 'Promotion Name',
    type: 'string',
    description: 'The name of the promotion associated with the event.'
};
exports.creative_slot = {
    label: 'Creative Slot',
    type: 'string',
    description: 'The name of the promotional creative slot associated with the event.'
};
exports.creative_name = {
    label: 'Creative Name',
    type: 'string',
    description: 'The name of the promotional creative.'
};
exports.tax = {
    label: 'Tax',
    type: 'number',
    description: 'Total tax associated with the transaction.',
    default: {
        '@path': '$.properties.tax'
    }
};
exports.shipping = {
    label: 'Shipping',
    type: 'number',
    description: 'Shipping cost associated with the transaction.',
    default: {
        '@path': '$.properties.shipping'
    }
};
exports.transaction_id = {
    label: 'Order Id',
    type: 'string',
    description: 'The unique identifier of a transaction.',
    default: {
        '@path': '$.properties.order_id'
    }
};
exports.affiliation = {
    label: 'Affiliation',
    type: 'string',
    description: 'Store or affiliation from which this transaction occurred (e.g. Google Store).',
    default: {
        '@path': '$.properties.affiliation'
    }
};
exports.client_id = {
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
};
exports.currency = {
    label: 'Currency',
    type: 'string',
    description: 'Currency of the items associated with the event, in 3-letter ISO 4217 format.',
    default: { '@path': '$.properties.currency' }
};
exports.value = {
    label: 'Value',
    type: 'number',
    description: 'The monetary value of the event.',
    default: {
        '@path': '$.properties.value'
    }
};
exports.coupon = {
    label: 'Coupon',
    type: 'string',
    description: 'Coupon code used for a purchase.'
};
exports.payment_type = {
    label: 'Payment Type',
    type: 'string',
    description: 'The chosen method of payment.',
    default: {
        '@path': '$.properties.payment_method'
    }
};
exports.minimal_items = {
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
};
exports.items_single_products = {
    ...exports.minimal_items,
    default: {
        '@arrayPath': [
            '$.properties',
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
};
exports.items_multi_products = {
    ...exports.minimal_items,
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
};
//# sourceMappingURL=ga4-properties.js.map