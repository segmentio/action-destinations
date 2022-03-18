"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audienceId = exports.attribute = exports.customerProfileId = void 0;
exports.customerProfileId = {
    label: 'Customer Profile ID',
    description: 'Unique identifier of the customer profile.',
    type: 'string',
    required: true
};
exports.attribute = {
    label: 'Attribute-Value pairs',
    description: 'Arbitrary additional JSON data associated with the customer profile.',
    type: 'object',
    required: false
};
exports.audienceId = {
    label: 'Talon.One audience ID',
    description: 'You should get this audience ID from Talon.One.',
    type: 'integer',
    multiple: true,
    required: false
};
//# sourceMappingURL=t1-properties.js.map