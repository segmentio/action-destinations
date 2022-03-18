"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateActivity = void 0;
async function createUpdateActivity(client, activity) {
    if (typeof activity.done !== 'undefined') {
        activity.done = activity.done ? 1 : 0;
    }
    return client.createUpdate('activities', activity);
}
exports.createUpdateActivity = createUpdateActivity;
//# sourceMappingURL=activities.js.map