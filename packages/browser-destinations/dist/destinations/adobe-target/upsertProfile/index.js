import { setPageParams, setMbox3rdPartyId } from '../utils';
const action = {
    title: 'Upsert Profile',
    description: 'Create or update a user profile in Adobe Target.',
    platform: 'web',
    defaultSubscription: 'type = "identify"',
    fields: {
        userId: {
            type: 'string',
            description: 'A user’s unique visitor ID. Setting an Mbox 3rd Party ID allows for updates via the Adobe Target Cloud Mode Destination. For more information, please see our Adobe Target Destination documentation.',
            label: 'Mbox 3rd Party ID',
            default: {
                '@if': {
                    exists: { '@path': '$.userId' },
                    then: { '@path': '$.userId' },
                    else: { '@path': '$.anonymousId' }
                }
            }
        },
        traits: {
            type: 'object',
            description: 'Profile parameters specific to a user. Please note, Adobe recommends that PII is hashed prior to sending to Adobe.',
            label: 'Profile Attributes',
            defaultObjectUI: 'keyvalue'
        }
    },
    perform: (Adobe, event) => {
        setMbox3rdPartyId(event.payload.userId);
        setPageParams({
            profile: {
                ...event.payload.traits
            }
        });
        const params = {
            mbox: event.settings.mbox_name,
            params: {
                event_name: 'profile_update'
            }
        };
        Adobe.target.trackEvent(params);
    }
};
export default action;
//# sourceMappingURL=index.js.map