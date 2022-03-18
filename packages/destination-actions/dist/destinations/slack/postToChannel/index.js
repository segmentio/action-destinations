"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
function isValidSlackUrl(webhookUrl) {
    return /^https:\/\/[a-zA-Z0-9.-]+\.slack.com[/a-zA-Z0-9]+$/.test(webhookUrl);
}
const action = {
    title: 'Post Message',
    description: 'Post a message to the specified Slack workspace and channel when the associated trigger criteria are met.',
    fields: {
        url: {
            label: 'Webhook URL',
            description: 'The webhook provided by Slack to connect with the desired Slack workspace.',
            type: 'string',
            required: true,
            format: 'uri'
        },
        text: {
            label: 'Message',
            required: true,
            description: "The text message to post to Slack. You can use [Slack's formatting syntax.](https://api.slack.com/reference/surfaces/formatting)",
            type: 'text'
        },
        channel: {
            label: 'Channel',
            description: 'The channel within the Slack workspace. Do not include the `#` character. For example, use `general`, not `#general`.',
            type: 'string'
        },
        username: {
            label: 'User',
            description: 'The sender of the posted message.',
            type: 'string',
            default: 'Segment'
        },
        icon_url: {
            label: 'Icon URL',
            description: 'The URL of the image that appears next to the User.',
            type: 'string',
            default: 'https://logo.clearbit.com/segment.com'
        }
    },
    perform: (request, { payload }) => {
        if (!isValidSlackUrl(payload.url)) {
            throw new actions_core_1.IntegrationError('Invalid Slack URL', 'Bad Request', 400);
        }
        else {
            return request(payload.url, {
                method: 'post',
                json: {
                    channel: payload.channel,
                    text: payload.text,
                    username: payload.username,
                    icon_url: payload.icon_url
                }
            });
        }
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map