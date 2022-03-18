"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action = {
    title: 'Delete Audience',
    description: 'This deletes the audience entity in Talon.One.',
    fields: {
        audienceId: {
            label: 'Segment Audience ID',
            description: 'You should get this audience ID from Segment.',
            type: 'string',
            required: true
        }
    },
    perform: (request, { payload }) => {
        return request(`https://integration.talon.one/segment/audiences/${payload.audienceId}`, { method: 'delete' });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map