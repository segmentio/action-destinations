"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateDeal = void 0;
async function createUpdateDeal(client, deal) {
    return client.createUpdate('deals', deal);
}
exports.createUpdateDeal = createUpdateDeal;
//# sourceMappingURL=deals.js.map