"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
function getNestedObjects(obj, objectPath = '', attributes = {}) {
    Object.keys(obj).forEach((key) => {
        const currObjectPath = objectPath ? `${objectPath}.${key}` : key;
        if (typeof obj[key] !== 'object') {
            attributes[currObjectPath] = obj[key].toString();
        }
        else {
            getNestedObjects(obj[key], currObjectPath, attributes);
        }
    });
    return attributes;
}
const objectToQueryString = (object) => Object.keys(object)
    .map((key) => `profile.${key}=${object[key].toString()}`)
    .join('&');
class AdobeTarget {
    constructor(userId, clientCode, traits, request) {
        this.updateProfile = async () => {
            const err = await this.lookupProfile(this.userId, this.clientCode);
            if (err) {
                throw err;
            }
            else {
                const traits = getNestedObjects(this.traits);
                const requestUrl = `https://${this.clientCode}.tt.omtrdc.net/m2/${this.clientCode}/profile/update?mbox3rdPartyId=${this.userId}&${objectToQueryString(traits)}`;
                return this.request(requestUrl, {
                    method: 'POST'
                });
            }
        };
        this.lookupProfile = async (userId, clientCode) => {
            try {
                await this.request(`https://${clientCode}.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${userId}?client=${clientCode}`, { method: 'get' });
            }
            catch (error) {
                return new actions_core_1.IntegrationError('No profile found in Adobe Target with this mbox3rdPartyId', 'Profile not found', 404);
            }
            return undefined;
        };
        this.userId = userId;
        this.clientCode = clientCode;
        this.traits = traits;
        this.request = request;
    }
}
exports.default = AdobeTarget;
//# sourceMappingURL=adobeTarget_operations.js.map