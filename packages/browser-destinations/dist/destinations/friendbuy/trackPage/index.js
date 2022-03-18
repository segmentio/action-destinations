import { createFriendbuyPayload } from '@segment/actions-shared';
export const trackPageDefaultSubscription = 'type = "page"';
export const trackPageFields = {
    name: {
        label: 'Page Name',
        description: 'The page name.',
        type: 'string',
        required: false,
        default: { '@path': '$.name' }
    },
    category: {
        label: 'Page Category',
        description: 'The page category.',
        type: 'string',
        required: false,
        default: { '@path': '$.category' }
    },
    title: {
        label: 'Page Title',
        description: 'The page title.',
        type: 'string',
        required: false,
        default: { '@path': '$.properties.title' }
    }
};
const action = {
    title: 'Track Page',
    description: 'Record when a customer visits a new page. Allow Friendbuy widget targeting by Page Name instead of URL.',
    defaultSubscription: trackPageDefaultSubscription,
    platform: 'web',
    fields: trackPageFields,
    perform: (friendbuyAPI, data) => {
        const friendbuyPayload = createFriendbuyPayload([
            ['name', data.payload.name || 'undefined'],
            ['category', data.payload.category],
            ['title', data.payload.title]
        ]);
        friendbuyAPI.push(['track', 'page', friendbuyPayload, true]);
    }
};
export default action;
//# sourceMappingURL=index.js.map