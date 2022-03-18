"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrUpdateOrganizationById = void 0;
async function createOrUpdateOrganizationById(request, domain, organizationId, organization) {
    if (organizationId) {
        return request(`https://${domain}.pipedrive.com/api/v1/organizations/${organizationId}`, {
            method: 'put',
            json: organization
        });
    }
    else {
        return request(`https://${domain}.pipedrive.com/api/v1/organizations`, {
            method: 'post',
            json: organization
        });
    }
}
exports.createOrUpdateOrganizationById = createOrUpdateOrganizationById;
//# sourceMappingURL=organizations.js.map