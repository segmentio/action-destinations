"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const purchase_1 = __importDefault(require("./purchase"));
const initiateCheckout_1 = __importDefault(require("./initiateCheckout"));
const addToCart_1 = __importDefault(require("./addToCart"));
const viewContent_1 = __importDefault(require("./viewContent"));
const search_1 = __importDefault(require("./search"));
const pageView_1 = __importDefault(require("./pageView"));
const custom_1 = __importDefault(require("./custom"));
const destination = {
    name: 'Facebook Conversions API (Actions)',
    slug: 'actions-facebook-conversions-api',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            pixelId: {
                label: 'Pixel ID',
                description: 'Your Facebook Pixel ID',
                type: 'string',
                required: true
            }
        },
    },
    extendRequest: () => {
        return {
            headers: { authorization: `Bearer ${process.env.ACTIONS_FB_CAPI_SYSTEM_USER_TOKEN}` }
        };
    },
    actions: {
        purchase: purchase_1.default,
        initiateCheckout: initiateCheckout_1.default,
        addToCart: addToCart_1.default,
        viewContent: viewContent_1.default,
        search: search_1.default,
        pageView: pageView_1.default,
        custom: custom_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map