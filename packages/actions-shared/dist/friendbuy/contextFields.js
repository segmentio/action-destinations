"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextAttributes = exports.contextFields = void 0;
exports.contextFields = {
    pageUrl: {
        label: 'Page URL',
        description: 'The URL of the web page the event was generated on.',
        type: 'string',
        format: 'uri',
        required: false,
        default: { '@path': '$.context.page.url' }
    },
    pageTitle: {
        label: 'Page Title',
        description: 'The title of the web page the event was generated on.',
        type: 'string',
        required: false,
        default: { '@path': '$.context.page.title' }
    },
    userAgent: {
        label: 'User Agent',
        description: "The browser's User-Agent string.",
        type: 'string',
        required: false,
        default: { '@path': '$.context.userAgent' }
    },
    ipAddress: {
        label: 'IP Address',
        description: "The users's IP address.",
        type: 'string',
        required: false,
        default: { '@path': '$.context.ip' }
    }
};
function contextAttributes(context) {
    return [
        ['pageUrl', context.pageUrl],
        ['pageTitle', context.pageTitle],
        ['userAgent', context.userAgent],
        ['ipAddress', context.ipAddress]
    ];
}
exports.contextAttributes = contextAttributes;
//# sourceMappingURL=contextFields.js.map