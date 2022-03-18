import { browserDestination } from '../../runtime/shim';
import { defaultValues } from '@segment/actions-core';
import { initScript } from './init-script';
import trackEvent, { trackEventDefaultSubscription } from './trackEvent';
import trackPage, { trackPageDefaultSubscription } from './trackPage';
export const destination = {
    name: 'StackAdapt (Actions)',
    slug: 'actions-stackadapt',
    mode: 'device',
    presets: [
        {
            name: 'Track Event',
            subscribe: trackEventDefaultSubscription,
            partnerAction: 'trackEvent',
            mapping: defaultValues(trackEvent.fields)
        },
        {
            name: 'Track Page',
            subscribe: trackPageDefaultSubscription,
            partnerAction: 'trackPage',
            mapping: defaultValues(trackPage.fields)
        }
    ],
    settings: {
        universalPixelId: {
            description: 'The universal pixel id for StackAdapt.',
            label: 'Universal Pixel Id',
            type: 'string',
            required: true
        }
    },
    initialize: async (_, dependencies) => {
        initScript();
        await dependencies.loadScript('https://tags.srv.stackadapt.com/events.js');
        return window.saq;
    },
    actions: {
        trackEvent,
        trackPage
    }
};
export default browserDestination(destination);
//# sourceMappingURL=index.js.map