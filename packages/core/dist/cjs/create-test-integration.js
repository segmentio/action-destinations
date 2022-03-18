"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestIntegration = void 0;
const create_test_event_1 = require("./create-test-event");
const destination_kit_1 = require("./destination-kit");
const map_values_1 = require("./map-values");
class TestDestination extends destination_kit_1.Destination {
    constructor(destination) {
        super(destination);
        this.responses = [];
    }
    async testAction(action, { event, mapping, settings, useDefaultMappings, auth }) {
        mapping = mapping ?? {};
        if (useDefaultMappings) {
            const fields = this.definition.actions[action].fields;
            const defaultMappings = map_values_1.mapValues(fields, 'default');
            mapping = { ...defaultMappings, ...mapping };
        }
        await super.executeAction(action, {
            event: create_test_event_1.createTestEvent(event),
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
            const defaultMappings = map_values_1.mapValues(fields, 'default');
            mapping = { ...defaultMappings, ...mapping };
        }
        if (!events || !events.length) {
            events = [{ type: 'track' }];
        }
        await super.executeBatch(action, {
            events: events.map((event) => create_test_event_1.createTestEvent(event)),
            mapping,
            settings: settings ?? {},
            auth
        });
        const responses = this.responses;
        this.responses = [];
        return responses;
    }
}
function createTestIntegration(destination) {
    return new TestDestination(destination);
}
exports.createTestIntegration = createTestIntegration;
//# sourceMappingURL=create-test-integration.js.map