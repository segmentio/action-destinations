function newSessionId() {
    return now();
}
function now() {
    return new Date().getTime();
}
const THIRTY_MINUTES = 30 * 60000;
function stale(id, updated, length = THIRTY_MINUTES) {
    if (id === null || updated === null) {
        return true;
    }
    const accessedAt = parseInt(updated, 10);
    if (now() - accessedAt >= length) {
        return true;
    }
    return false;
}
const action = {
    title: 'Session Plugin',
    description: 'Generates a Session ID and attaches it to every Amplitude browser based event.',
    platform: 'web',
    hidden: true,
    defaultSubscription: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
    fields: {
        sessionLength: {
            label: 'Session Length',
            type: 'number',
            required: false,
            description: 'Time in milliseconds to be used before considering a session stale.'
        }
    },
    lifecycleHook: 'enrichment',
    perform: (_, { context, payload }) => {
        const ls = window.localStorage;
        const newSession = newSessionId();
        const raw = ls.getItem('analytics_session_id');
        const updated = ls.getItem('analytics_session_id.last_access');
        let id = raw;
        if (stale(raw, updated, payload.sessionLength)) {
            id = newSession;
            ls.setItem('analytics_session_id', id.toString());
        }
        else {
            id = parseInt(id, 10);
        }
        ls.setItem('analytics_session_id.last_access', newSession.toString());
        if (context.event.integrations?.All !== false || context.event.integrations['Actions Amplitude']) {
            context.updateEvent('integrations.Actions Amplitude', {});
            context.updateEvent('integrations.Actions Amplitude.session_id', id);
        }
        return;
    }
};
export default action;
//# sourceMappingURL=index.js.map