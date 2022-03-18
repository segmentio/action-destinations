import { COPY, ROOT, mapEvent } from '@segment/actions-shared';
import { trackPurchaseFields } from '@segment/actions-shared';
import { addName, enjoinInteger, enjoinNumber, enjoinString, parseDate, removeCustomerIfNoId } from '@segment/actions-shared';
export const browserTrackPurchaseFields = trackPurchaseFields({});
export const trackPurchaseDefaultSubscription = 'event = "Order Completed"';
const trackPurchasePub = {
    fields: {
        orderId: { name: 'id', convert: enjoinString },
        amount: { convert: enjoinNumber },
        currency: COPY,
        coupon: { name: 'couponCode' },
        attributionId: COPY,
        referralCode: COPY,
        giftCardCodes: {
            type: 'array'
        },
        products: {
            type: 'array',
            defaultObject: { sku: 'unknown', name: 'unknown', quantity: 1 },
            fields: {
                sku: { convert: enjoinString },
                name: COPY,
                quantity: { convert: enjoinInteger },
                price: { convert: enjoinNumber },
                description: COPY,
                category: COPY,
                url: COPY,
                image_url: { name: 'imageUrl' }
            }
        },
        customerId: { name: ['customer', 'id'], convert: enjoinString },
        anonymousId: { name: ['customer', 'anonymousId'] },
        email: { name: ['customer', 'email'] },
        isNewCustomer: { name: ['customer', 'isNewCustomer'] },
        loyaltyStatus: { name: ['customer', 'loyaltyStatus'] },
        firstName: { name: ['customer', 'firstName'] },
        lastName: { name: ['customer', 'lastName'] },
        name: { name: ['customer', 'name'] },
        age: { name: ['customer', 'age'], convert: enjoinInteger },
        birthday: { name: ['customer', 'birthday'], convert: parseDate }
    },
    unmappedFieldObject: ROOT,
    finalize: removeCustomerIfNoId
};
const action = {
    title: 'Track Purchase',
    description: 'Record when a customer makes a purchase.',
    defaultSubscription: trackPurchaseDefaultSubscription,
    platform: 'web',
    fields: browserTrackPurchaseFields,
    perform: (friendbuyAPI, { payload }) => {
        addName(payload);
        const friendbuyPayload = mapEvent(trackPurchasePub, payload);
        friendbuyAPI.push(['track', 'purchase', friendbuyPayload, true]);
    }
};
export default action;
//# sourceMappingURL=index.js.map