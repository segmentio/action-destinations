import { createTestEvent } from './create-test-event';
import { Destination } from './destination-kit';
import { mapValues } from './map-values';
class TestDestination extends Destination {
    constructor(destination) {
        super(destination);
        this.responses = [];
    }
    async testAction(action, { event, mapping, settings, useDefaultMappings, auth }) {
        mapping = mapping ?? {};
        if (useDefaultMappings) {
            const fields = this.definition.actions[action].fields;
            const defaultMappings = mapValues(fields, 'default');
            mapping = { ...defaultMappings, ...mapping };
        }
        await super.executeAction(action, {
            event: createTestEvent(event),
            mapping,
            settings: settings ?? {},
            auth
        });
        const responses = this.responses;
        this.responses = [];
        return responses;
    }
    async testBatchAction(action, { events, mapping, settings, useDefaultMappings, auth }) {
        mapping = mapping ?? {};
        if (useDefaultMappings) {
            const fields = this.definition.actions[action].fields;
            const defaultMappings = mapValues(fields, 'default');
            mapping = { ...defaultMappings, ...mapping };
        }
        if (!events || !events.length) {
            events = [{ type: 'track' }];
        }
        await super.executeBatch(action, {
            events: events.map((event) => createTestEvent(event)),
            mapping,
            settings: settings ?? {},
            auth
        });
        const responses = this.responses;
        this.responses = [];
        return responses;
    }
}
export function createTestIntegration(destination) {
    return new TestDestination(destination);
}
//# sourceMappingURL=create-test-integration.js.map