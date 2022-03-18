import { browserDestination } from '../../runtime/shim';
import { defaultValues } from '@segment/actions-core';
import trackCustomer, { trackCustomerDefaultSubscription } from './trackCustomer';
import trackPurchase, { browserTrackPurchaseFields, trackPurchaseDefaultSubscription } from './trackPurchase';
import trackSignUp, { browserTrackSignUpFields, trackSignUpDefaultSubscription } from './trackSignUp';
import trackPage, { trackPageDefaultSubscription, trackPageFields } from './trackPage';
import trackCustomEvent from './trackCustomEvent';
import { trackCustomerFields } from '@segment/actions-shared';
const presets = [
    {
        name: 'Track Customer',
        subscribe: trackCustomerDefaultSubscription,
        partnerAction: 'trackCustomer',
        mapping: defaultValues(trackCustomerFields)
    },
    {
        name: 'Track Purchase',
        subscribe: trackPurchaseDefaultSubscription,
        partnerAction: 'trackPurchase',
        mapping: defaultValues(browserTrackPurchaseFields)
    },
    {
        name: 'Track Sign Up',
        subscribe: trackSignUpDefaultSubscription,
        partnerAction: 'trackSignUp',
        mapping: defaultValues(browserTrackSignUpFields)
    },
    {
        name: 'Track Page',
        subscribe: trackPageDefaultSubscription,
        partnerAction: 'trackPage',
        mapping: defaultValues(trackPageFields)
    }
];
export const destination = {
    name: 'Friendbuy (Web Destination)',
    slug: 'actions-friendbuy',
    mode: 'device',
    settings: {
        merchantId: {
            label: 'Friendbuy Merchant ID',
            description: 'Find your Friendbuy Merchant ID by logging in to your [Friendbuy account](https://retailer.friendbuy.io/) and going to Developer Center > Friendbuy Code.',
            type: 'string',
            format: 'uuid',
            required: true
        }
    },
    initialize: async ({ settings }, dependencies) => {
        let friendbuyAPI;
        window.friendbuyAPI = friendbuyAPI = window.friendbuyAPI || [];
        const friendbuyBaseHost = window.friendbuyBaseHost ?? 'fbot.me';
        friendbuyAPI.merchantId = settings.merchantId;
        friendbuyAPI.push(['merchant', settings.merchantId]);
        void dependencies.loadScript(`https://static.${friendbuyBaseHost}/friendbuy.js`);
        void dependencies.loadScript(`https://campaign.${friendbuyBaseHost}/${settings.merchantId}/campaigns.js`);
        return friendbuyAPI;
    },
    presets,
    actions: {
        trackCustomer,
        trackPurchase,
        trackSignUp,
        trackPage,
        trackCustomEvent
    }
};
export default browserDestination(destination);
//# sourceMappingURL=index.js.map