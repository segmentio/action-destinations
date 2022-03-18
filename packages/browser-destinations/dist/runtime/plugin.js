import { transform } from '@segment/actions-core/mapping-kit';
import { parseFql, validate } from '@segment/destination-subscriptions';
import { loadScript } from './load-script';
import { resolveWhen } from './resolve-when';
export function generatePlugins(def, settings, subscriptions) {
    let hasInitialized = false;
    let client;
    let analytics;
    const load = async (_ctx, analyticsInstance) => {
        if (hasInitialized) {
            return;
        }
        analytics = analyticsInstance;
        client = await def.initialize?.({ settings, analytics }, { loadScript, resolveWhen });
        hasInitialized = true;
    };
    return Object.entries(def.actions).reduce((acc, [key, action]) => {
        const actionSubscriptions = subscriptions.filter((s) => s.enabled && s.partnerAction === key);
        if (actionSubscriptions.length === 0)
            return acc;
        async function evaluate(ctx) {
            const invocations = [];
            for (const sub of actionSubscriptions) {
                const isSubscribed = validate(parseFql(sub.subscribe), ctx.event);
                if (!isSubscribed)
                    continue;
                const mapping = (sub.mapping ?? {});
                const payload = transform(mapping, ctx.event);
                const input = {
                    payload,
                    mapping,
                    settings,
                    analytics,
                    context: ctx
                };
                invocations.push(action.perform(client, input));
            }
            await Promise.all(invocations);
            return ctx;
        }
        const plugin = {
            name: `${def.name} ${key}`,
            type: action.lifecycleHook ?? 'destination',
            version: '0.1.0',
            ready: () => Promise.resolve(),
            isLoaded: () => hasInitialized,
            load,
            track: evaluate,
            page: evaluate,
            alias: evaluate,
            identify: evaluate,
            group: evaluate
        };
        acc.push(plugin);
        return acc;
    }, []);
}
//# sourceMappingURL=plugin.js.map