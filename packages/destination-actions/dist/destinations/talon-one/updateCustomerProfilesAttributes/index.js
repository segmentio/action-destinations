"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const t1_properties_1 = require("../t1-properties");
const action = {
    title: 'Update Customer Profile Attribute-Value pairs.',
    description: 'This synchronizes attributes data for multiple customer profiles.',
    fields: {
        customerProfileId: { ...t1_properties_1.customerProfileId },
        attributes: { ...t1_properties_1.attribute },
        mutualAttributes: { ...t1_properties_1.attribute }
    },
    perform: (request, { payload }) => {
        return request(`https://integration.talon.one/segment/customer_profiles/attributes`, {
            method: 'put',
            json: {
                data: [
                    {
                        customerProfileId: payload.customerProfileId,
                        attributes: payload.attributes
                    }
                ],
                mutualAttributes: payload.mutualAttributes
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map