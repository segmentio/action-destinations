"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrUpdatePersonById = void 0;
async function createOrUpdatePersonById(request, domain, personId, person) {
    if (personId) {
        return request(`https://${domain}.pipedrive.com/api/v1/persons/${personId}`, {
            method: 'put',
            json: person
        });
    }
    else {
        return request(`https://${domain}.pipedrive.com/api/v1/persons`, {
            method: 'post',
            json: person
        });
    }
}
exports.createOrUpdatePersonById = createOrUpdatePersonById;
//# sourceMappingURL=persons.js.map