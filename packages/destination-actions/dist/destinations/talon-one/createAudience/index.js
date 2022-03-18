"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action = {
    title: 'Create Audience',
    description: 'This creates a new audience entity in Talon.One.',
    fields: {
        audienceId: {
            label: 'Segment Audience ID',
            description: 'You should get this audience ID from Segment.',
            type: 'string',
            required: true
        },
        audienceName: {
            label: 'Audience Name',
            description: 'You should get this audience name from Segment.',
            type: 'string',
            required: true
        }
    },
    perform: (request, { payload }) => {
        return request(`https://integration.talon.one/segment/audiences`, {
            method: 'post',
            json: {
                audienceId: payload.audienceId,
                audienceName: payload.audienceName
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map