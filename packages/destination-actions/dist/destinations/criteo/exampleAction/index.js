"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action = {
    title: 'Example Action',
    description: 'An example action that supports batch payloads.',
    fields: {
        greeting: {
            label: 'Greeting',
            description: 'A greeting message',
            type: 'string',
            required: true
        }
    },
    perform: (request, data) => {
        return request('https://example.com', {
            method: 'post',
            json: data.payload
        });
    },
    performBatch: (request, data) => {
        return request('https://example.com', {
            method: 'post',
            json: data.payload
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map