export function browserDestination(definition) {
    return async (settings) => {
        const plugin = await import('./plugin');
        return plugin.generatePlugins(definition, settings, settings.subscriptions || []);
    };
}
//# sourceMappingURL=shim.js.map