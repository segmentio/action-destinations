let cachedUser = {
    id: undefined,
    anonymousId: undefined,
    traits: null
};
export function resetUserCache() {
    cachedUser = {
        id: undefined,
        anonymousId: undefined,
        traits: null
    };
}
function shouldSendToBraze(event) {
    if (event.userId && event.userId !== cachedUser.id) {
        return true;
    }
    if (event.anonymousId && event.anonymousId !== cachedUser.anonymousId) {
        return true;
    }
    const traits = event.traits ?? {};
    return JSON.stringify(cachedUser.traits) !== JSON.stringify(traits);
}
const action = {
    title: 'Debounce Middleware',
    description: 'When enabled, it ensures that only events where at least one changed trait value are sent to Braze, and events with duplicate traits are not sent.',
    platform: 'web',
    defaultSubscription: 'type = "identify" or type = "group"',
    fields: {},
    lifecycleHook: 'before',
    perform: (_client, data) => {
        const event = data.context.event;
        const analyticsUser = data.analytics.user();
        const ctx = data.context;
        const shouldSend = shouldSendToBraze(event);
        ctx.updateEvent('integrations.Braze Web Mode (Actions)', shouldSend);
        ctx.updateEvent('integrations.Braze Cloud Mode (Actions)', shouldSend);
        ctx.updateEvent('integrations.Appboy', shouldSend);
        cachedUser.id = analyticsUser.id();
        cachedUser.anonymousId = analyticsUser.anonymousId();
        cachedUser.traits = analyticsUser.traits();
    }
};
export default action;
//# sourceMappingURL=index.js.map