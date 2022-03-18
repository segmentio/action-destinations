"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action = {
    title: 'Update Audience',
    description: 'This synchronizes audience data if there is an existing audience entity.',
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
        return request(`https://integration.talon.one/segment/audiences/${payload.audienceId}`, {
            method: 'put',
            json: {
                audienceName: payload.audienceName
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map