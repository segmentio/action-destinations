"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNote = void 0;
async function createNote(client, note) {
    return client.createUpdate('notes', note);
}
exports.createNote = createNote;
//# sourceMappingURL=notes.js.map