const action = {
    title: 'Track Event',
    description: 'Send visitor events to Koala.',
    defaultSubscription: 'type = "track"',
    platform: 'web',
    fields: {
        event: {
            type: 'string',
            required: true,
            description: 'The event name.',
            label: 'Event Name',
            default: { '@path': '$.event' }
        },
        properties: {
            type: 'object',
            required: false,
            description: 'Properties to send with the event.',
            label: 'Event Properties',
            default: { '@path': '$.properties' },
            defaultObjectUI: 'object'
        }
    },
    perform: (koala, { payload }) => {
        if (payload?.event) {
            return koala.track(payload.event, payload.properties);
        }
    }
};
export default action;
//# sourceMappingURL=index.js.map