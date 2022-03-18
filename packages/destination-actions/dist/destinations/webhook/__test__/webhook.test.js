"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nock_1 = __importDefault(require("nock"));
const actions_core_1 = require("@segment/actions-core");
const index_1 = __importDefault(require("../index"));
const testDestination = actions_core_1.createTestIntegration(index_1.default);
const timestamp = new Date().toISOString();
describe('Webhook', () => {
    describe('send', () => {
        it('should work with default mapping', async () => {
            const url = 'https://example.com';
            const event = actions_core_1.createTestEvent({
                timestamp,
                event: 'Test Event'
            });
            nock_1.default(url)
                .post('/', event)
                .reply(200);
            const responses = await testDestination.testAction('send', {
                event,
                mapping: {
                    url
                },
                useDefaultMappings: true
            });
            expect(responses.length).toBe(1);
            expect(responses[0].status).toBe(200);
        });
        it('supports customizations', async () => {
            const url = 'https://example.build';
            const event = actions_core_1.createTestEvent({
                timestamp,
                event: 'Test Event'
            });
            const data = { cool: true };
            nock_1.default(url).put('/', data).reply(200);
            const responses = await testDestination.testAction('send', {
                event,
                mapping: {
                    url,
                    method: 'PUT',
                    data: { cool: true }
                }
            });
            expect(responses.length).toBe(1);
            expect(responses[0].status).toBe(200);
        });
        it('supports customizations', async () => {
            const url = 'https://example.build';
            const event = actions_core_1.createTestEvent({
                timestamp,
                event: 'Test Event'
            });
            const data = { cool: true };
            nock_1.default(url).put('/', data).reply(200);
            const responses = await testDestination.testAction('send', {
                event,
                mapping: {
                    url,
                    method: 'PUT',
                    data: { cool: true }
                }
            });
            expect(responses.length).toBe(1);
            expect(responses[0].status).toBe(200);
        });
    });
});
//# sourceMappingURL=webhook.test.js.map