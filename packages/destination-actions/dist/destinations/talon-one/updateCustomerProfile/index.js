"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const t1_properties_1 = require("../t1-properties");
const action = {
    title: 'Update Customer Profile',
    description: 'This synchronizes customer profile data concerning audiences and attributes.',
    fields: {
        attributes: { ...t1_properties_1.attribute },
        customerProfileId: { ...t1_properties_1.customerProfileId },
        deleteAudienceIDs: { ...t1_properties_1.audienceId },
        addAudienceIDs: { ...t1_properties_1.audienceId },
        runRuleEngine: {
            label: 'Run rule engine',
            description: 'This runs rule engine in Talon.One upon updating customer profile. Set to true to trigger rules.',
            type: 'boolean',
            default: false
        }
    },
    perform: (request, { payload }) => {
        return request(`https://integration.talon.one/segment/customer_profile/${payload.customerProfileId}`, {
            method: 'put',
            json: {
                attributes: payload.attributes,
                audiencesChanges: {
                    adds: payload.addAudienceIDs,
                    deletes: payload.deleteAudienceIDs
                },
                runRuleEngine: payload.runRuleEngine
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map