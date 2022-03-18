export const trackPageDefaultSubscription = 'type = "page"';
const action = {
    title: 'Track Page',
    description: 'Record when a user visits a page.',
    platform: 'web',
    defaultSubscription: trackPageDefaultSubscription,
    fields: {
        properties: {
            type: 'object',
            required: false,
            description: 'Hash of properties for this page view.',
            label: 'Page Properties',
            default: {
                '@path': '$.properties'
            }
        }
    },
    perform: (saq, { settings, payload }) => {
        const pixelId = settings.universalPixelId;
        const properties = payload.properties ?? {};
        saq('ts', pixelId, properties);
    }
};
export default action;
//# sourceMappingURL=index.js.map