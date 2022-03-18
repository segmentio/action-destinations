"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action = {
    title: 'Send',
    description: 'Send an HTTP request.',
    fields: {
        url: {
            label: 'URL',
            description: 'URL to deliver data to.',
            type: 'string',
            required: true,
            format: 'uri'
        },
        method: {
            label: 'Method',
            description: 'HTTP method to use.',
            type: 'string',
            choices: [
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'PATCH', value: 'PATCH' },
                { label: 'DELETE', value: 'DELETE' },
                { label: 'GET', value: 'GET' }
            ],
            default: 'POST',
            required: true
        },
        data: {
            label: 'Data',
            description: 'Payload to deliver to webhook URL (JSON-encoded).',
            type: 'object',
            default: { '@path': '$.' }
        }
    },
    perform: (request, { payload }) => {
        return request(payload.url, {
            method: payload.method,
            json: payload.data
        });
    },
    performBatch: (request, { payload }) => {
        const { url, method } = payload[0];
        return request(url, {
            method: method,
            json: payload.map(({ data }) => data)
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map