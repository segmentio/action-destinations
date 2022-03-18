"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const trackEvent_1 = __importDefault(require("./trackEvent"));
const identifyUser_1 = __importDefault(require("./identifyUser"));
const groupIdentifyUser_1 = __importDefault(require("./groupIdentifyUser"));
const alias_1 = __importDefault(require("./alias"));
const presets = [
    {
        name: 'Track Calls',
        subscribe: 'type = "track"',
        partnerAction: 'trackEvent',
        mapping: actions_core_1.defaultValues(trackEvent_1.default.fields)
    },
    {
        name: 'Page Calls',
        subscribe: 'type = "page"',
        partnerAction: 'trackEvent',
        mapping: {
            ...actions_core_1.defaultValues(trackEvent_1.default.fields),
            event: {
                '@template': 'Viewed {{name}}'
            }
        }
    },
    {
        name: 'Screen Calls',
        subscribe: 'type = "screen"',
        partnerAction: 'trackEvent',
        mapping: {
            ...actions_core_1.defaultValues(trackEvent_1.default.fields),
            event: {
                '@template': 'Viewed {{name}}'
            }
        }
    },
    {
        name: 'Identify Calls',
        subscribe: 'type = "identify"',
        partnerAction: 'identifyUser',
        mapping: actions_core_1.defaultValues(identifyUser_1.default.fields)
    },
    {
        name: 'Group Calls',
        subscribe: 'type = "group"',
        partnerAction: 'groupIdentifyUser',
        mapping: actions_core_1.defaultValues(groupIdentifyUser_1.default.fields)
    }
];
const destination = {
    name: 'Mixpanel (Actions)',
    slug: 'actions-mixpanel',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            projectToken: {
                label: 'Project Token',
                description: 'Mixpanel project token.',
                type: 'string',
                required: true
            },
            apiSecret: {
                label: 'Secret Key',
                description: 'Mixpanel project secret.',
                type: 'string',
                required: true
            }
        },
        testAuthentication: (request, { settings }) => {
            return request(`https://mixpanel.com/api/app/validate-project-credentials/`, {
                method: 'post',
                body: JSON.stringify({
                    api_secret: settings.apiSecret,
                    project_token: settings.projectToken
                })
            });
        }
    },
    presets,
    actions: {
        trackEvent: trackEvent_1.default,
        identifyUser: identifyUser_1.default,
        groupIdentifyUser: groupIdentifyUser_1.default,
        alias: alias_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map