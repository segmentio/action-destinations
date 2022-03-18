import { COPY, ROOT, mapEvent } from '@segment/actions-shared';
import { trackCustomerFields } from '@segment/actions-shared';
import { addName, enjoinInteger, enjoinString, parseDate } from '@segment/actions-shared';
export const trackCustomerDefaultSubscription = 'type = "identify"';
const trackCustomerPub = {
    fields: {
        customerId: { name: 'id', convert: enjoinString },
        anonymousID: COPY,
        email: COPY,
        isNewCustomer: COPY,
        loyaltyStatus: COPY,
        firstName: COPY,
        lastName: COPY,
        name: COPY,
        age: { convert: enjoinInteger },
        birthday: { convert: parseDate },
        language: COPY,
        addressCountry: { name: 'country' },
        addressState: { name: 'state' },
        addressCity: { name: 'city' },
        addressPostalCode: { name: 'zipCode', convert: enjoinString }
    },
    unmappedFieldObject: ROOT
};
const action = {
    title: 'Track Customer',
    description: 'Create a new customer profile or update an existing customer profile.',
    defaultSubscription: trackCustomerDefaultSubscription,
    platform: 'web',
    fields: trackCustomerFields,
    perform: (friendbuyAPI, { payload }) => {
        addName(payload);
        const friendbuyPayload = mapEvent(trackCustomerPub, payload);
        friendbuyAPI.push(['track', 'customer', friendbuyPayload, true]);
    }
};
export default action;
//# sourceMappingURL=index.js.map