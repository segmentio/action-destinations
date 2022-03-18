"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const purchase_1 = __importDefault(require("./purchase"));
const addToCart_1 = __importDefault(require("./addToCart"));
const pageView_1 = __importDefault(require("./pageView"));
const customEvent_1 = __importDefault(require("./customEvent"));
const selectItem_1 = __importDefault(require("./selectItem"));
const beginCheckout_1 = __importDefault(require("./beginCheckout"));
const selectPromotion_1 = __importDefault(require("./selectPromotion"));
const viewItem_1 = __importDefault(require("./viewItem"));
const search_1 = __importDefault(require("./search"));
const viewItemList_1 = __importDefault(require("./viewItemList"));
const signUp_1 = __importDefault(require("./signUp"));
const viewPromotion_1 = __importDefault(require("./viewPromotion"));
const viewCart_1 = __importDefault(require("./viewCart"));
const login_1 = __importDefault(require("./login"));
const generateLead_1 = __importDefault(require("./generateLead"));
const addToWishlist_1 = __importDefault(require("./addToWishlist"));
const addPaymentInfo_1 = __importDefault(require("./addPaymentInfo"));
const refund_1 = __importDefault(require("./refund"));
const removeFromCart_1 = __importDefault(require("./removeFromCart"));
const destination = {
    name: 'Actions Google Analytic 4',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            measurementId: {
                label: 'Measurement ID',
                description: 'The measurement ID associated with a stream. Found in the Google Analytics UI under: Admin > Data Streams > choose your stream > Measurement ID',
                type: 'string',
                required: true
            },
            apiSecret: {
                label: 'API Secret',
                description: 'An API SECRET generated in the Google Analytics UI, navigate to: Admin > Data Streams > choose your stream > Measurement Protocol > Create',
                type: 'string',
                required: true
            }
        }
    },
    extendRequest({ settings }) {
        return {
            searchParams: {
                measurement_id: settings.measurementId,
                api_secret: settings.apiSecret
            }
        };
    },
    actions: {
        purchase: purchase_1.default,
        addToCart: addToCart_1.default,
        pageView: pageView_1.default,
        customEvent: customEvent_1.default,
        selectItem: selectItem_1.default,
        beginCheckout: beginCheckout_1.default,
        selectPromotion: selectPromotion_1.default,
        viewItem: viewItem_1.default,
        removeFromCart: removeFromCart_1.default,
        viewCart: viewCart_1.default,
        search: search_1.default,
        viewItemList: viewItemList_1.default,
        signUp: signUp_1.default,
        viewPromotion: viewPromotion_1.default,
        addPaymentInfo: addPaymentInfo_1.default,
        refund: refund_1.default,
        login: login_1.default,
        generateLead: generateLead_1.default,
        addToWishlist: addToWishlist_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map