import { COPY, ROOT, mapEvent } from '@segment/actions-shared';
import { trackSignUpFields } from '@segment/actions-shared';
import { addName, enjoinInteger, enjoinString, parseDate } from '@segment/actions-shared';
export const browserTrackSignUpFields = trackSignUpFields({ requireCustomerId: true, requireEmail: true });
export const trackSignUpDefaultSubscription = 'event = "Signed Up"';
const trackSignUpPub = {
    fields: {
        coupon: { name: 'couponCode' },
        attributionId: COPY,
        referralCode: COPY,
        customerId: { name: 'id', convert: enjoinString },
        anonymousID: COPY,
        isNewCustomer: COPY,
        loyaltyStatus: COPY,
        email: COPY,
        firstName: COPY,
        lastName: COPY,
        name: COPY,
        age: { convert: enjoinInteger },
        birthday: { convert: parseDate }
    },
    unmappedFieldObject: ROOT
};
const action = {
    title: 'Track Sign Up',
    description: 'Record when a customer signs up for a service.',
    defaultSubscription: trackSignUpDefaultSubscription,
    platform: 'web',
    fields: browserTrackSignUpFields,
    perform: (friendbuyAPI, { payload }) => {
        addName(payload);
        const friendbuyPayload = mapEvent(trackSignUpPub, payload);
        friendbuyAPI.push(['track', 'sign_up', friendbuyPayload, true]);
    }
};
export default action;
//# sourceMappingURL=index.js.map