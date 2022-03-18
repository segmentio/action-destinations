"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const reportWebEvent_1 = __importDefault(require("./reportWebEvent"));
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
};
const singleProductContents = {
    ...actions_core_1.defaultValues(reportWebEvent_1.default.fields),
    contents: {
        '@arrayPath': [
            '$.properties',
            {
                ...productProperties
            }
        ]
    }
};
const multiProductContents = {
    ...actions_core_1.defaultValues(reportWebEvent_1.default.fields),
    contents: {
        '@arrayPath': [
            '$.properties.products',
            {
                ...productProperties
            }
        ]
    }
};
const presets = [
    {
        name: 'View Content',
        subscribe: 'type="page"',
        partnerAction: 'reportWebEvent',
        mapping: {
            ...singleProductContents,
            event: 'ViewContent'
        }
    },
    {
        name: 'Search',
        subscribe: 'event = "Products Searched"',
        partnerAction: 'reportWebEvent',
        mapping: {
            ...singleProductContents,
            event: 'Search'
        }
    },
    {
        name: 'Add to Wishlist',
        subscribe: 'event = "Product Added to Wishlist"',
        partnerAction: 'reportWebEvent',
        mapping: {
            ...singleProductContents,
            event: 'AddToWishlist'
        }
    },
    {
        name: 'Add to Cart',
        subscribe: 'event = "Product Added"',
        partnerAction: 'reportWebEvent',
        mapping: {
            ...singleProductContents,
            event: 'AddToCart'
        }
    },
    {
        name: 'Initiate Checkout',
        subscribe: 'event = "Checkout Started"',
        partnerAction: 'reportWebEvent',
        mapping: {
            ...multiProductContents,
            event: 'InitiateCheckout'
        }
    },
    {
        name: 'Add Payment Info',
        subscribe: 'event = "Payment Info Entered"',
        partnerAction: 'reportWebEvent',
        mapping: {
            ...multiProductContents,
            event: 'AddPaymentInfo'
        }
    },
    {
        name: 'Place an Order',
        subscribe: 'event = "Order Completed"',
        partnerAction: 'reportWebEvent',
        mapping: {
            ...multiProductContents,
            event: 'PlaceAnOrder'
        }
    }
];
const destination = {
    name: 'Tiktok Conversions',
    slug: 'tiktok-conversions',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            accessToken: {
                label: 'Access Token',
                description: 'Your TikTok Access Token. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to generate an access token via the TikTok Ads Manager or API.',
                type: 'string',
                required: true
            },
            pixelCode: {
                label: 'Pixel Code',
                type: 'string',
                description: 'Your TikTok Pixel ID. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to find this value.',
                required: true
            }
        },
        testAuthentication: (request, { settings }) => {
            return request('https://business-api.tiktok.com/open_api/v1.2/pixel/track/', {
                method: 'post',
                json: {
                    pixel_code: settings.pixelCode,
                    event: 'Test Event',
                    timestamp: '',
                    context: {}
                }
            });
        }
    },
    extendRequest({ settings }) {
        return {
            headers: { 'Access-Token': settings.accessToken }
        };
    },
    presets,
    actions: {
        reportWebEvent: reportWebEvent_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map