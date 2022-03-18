"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateLead = void 0;
async function createUpdateLead(client, lead) {
    return client.createUpdate('leads', lead);
}
exports.createUpdateLead = createUpdateLead;
//# sourceMappingURL=leads.js.map