"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCustomFieldsFromPayloadToEntity = void 0;
function addCustomFieldsFromPayloadToEntity(payload, entity) {
    if (!payload.custom_fields) {
        return;
    }
    Object.assign(entity, payload.custom_fields);
}
exports.addCustomFieldsFromPayloadToEntity = addCustomFieldsFromPayloadToEntity;
//# sourceMappingURL=utils.js.map