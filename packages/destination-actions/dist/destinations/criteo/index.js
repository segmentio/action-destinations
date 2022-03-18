"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exampleAction_1 = __importDefault(require("./exampleAction"));
const destination = {
    name: 'Criteo',
    slug: 'actions-criteo',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            api_key: {
                label: 'API Key',
                description: 'Your Criteo API key',
                type: 'string',
                required: true
            }
        },
        testAuthentication: (_request) => {
        }
    },
    extendRequest: ({ settings }) => {
        return {
            headers: { Authorization: `Bearer ${settings.api_key}` }
        };
    },
    actions: {
        exampleAction: exampleAction_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map