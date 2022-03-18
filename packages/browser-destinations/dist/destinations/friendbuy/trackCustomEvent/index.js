import { COPY, DROP, ROOT, mapEvent } from '@segment/actions-shared';
import { trackCustomEventFields } from '@segment/actions-shared';
import { addName, enjoinInteger, enjoinString, moveEventPropertiesToRoot, parseDate } from '@segment/actions-shared';
export const browserTrackCustomEventFields = trackCustomEventFields({});
const trackCustomEventPub = {
    fields: {
        eventType: DROP,
        deduplicationId: COPY,
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
    unmappedFieldObject: ROOT
};
const action = {
    title: 'Track Custom Event',
    description: 'Record when a customer completes any custom event that you define.',
    platform: 'web',
    fields: browserTrackCustomEventFields,
    perform: (friendbuyAPI, { payload }) => {
        const analyticsPayload = moveEventPropertiesToRoot(payload);
        addName(analyticsPayload);
        const friendbuyPayload = mapEvent(trackCustomEventPub, analyticsPayload);
        friendbuyAPI.push(['track', payload.eventType, friendbuyPayload]);
    }
};
export default action;
//# sourceMappingURL=index.js.map