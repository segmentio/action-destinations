"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const t1_properties_1 = require("../t1-properties");
const action = {
    title: 'Update Customer Profiles Audiences',
    description: 'This synchronizes audience data for multiple customer profiles.',
    fields: {
        deleteAudienceIDs: { ...t1_properties_1.audienceId },
        addAudienceIDs: { ...t1_properties_1.audienceId },
        customerProfileId: { ...t1_properties_1.customerProfileId }
    },
    perform: (request, { payload }) => {
        return request(`https://integration.talon.one/segment/customer_profiles/audiences`, {
            method: 'put',
            json: {
                data: [
                    {
                        customerProfileId: payload.customerProfileId,
                        adds: payload.addAudienceIDs,
                        deletes: payload.deleteAudienceIDs
                    }
                ]
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map