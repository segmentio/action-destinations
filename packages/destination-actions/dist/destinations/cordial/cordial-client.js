"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CordialClient {
    constructor(settings, request) {
        this.apiUrl = `${settings.endpoint}/v2`;
        this.request = request;
    }
    addContactActivity(payload) {
        return this.request(`${this.apiUrl}/contactactivities`, {
            method: 'post',
            json: {
                [payload.identifyByKey]: payload.identifyByValue,
                a: payload.action,
                time: payload.time,
                properties: payload.properties
            }
        });
    }
    async upsertContact(userIdentifier, attributes) {
        return this.request(`${this.apiUrl}/contacts`, {
            method: 'post',
            json: {
                ...userIdentifier,
                ...attributes,
                request_source: 'integration-segment'
            }
        });
    }
    async getList(segmentGroupId, listName) {
        let result = null;
        try {
            const lists = await this.request(`${this.apiUrl}/accountlists`, {
                method: 'get'
            });
            for (const list of lists.data) {
                if (list.segment_group_id == segmentGroupId) {
                    result = list;
                    break;
                }
            }
            if (!result && listName) {
                listName = this.prepareListName(listName);
                for (const list of lists.data) {
                    if (list.name == listName) {
                        result = list;
                        break;
                    }
                }
            }
        }
        catch (e) {
            return result;
        }
        return result;
    }
    async upsertList(segmentGroupId, listName) {
        const list = await this.getList(segmentGroupId, listName);
        if (list) {
            return list;
        }
        if (!listName) {
            listName = 'segment_' + segmentGroupId;
        }
        listName = this.prepareListName(listName);
        const response = await this.request(`${this.apiUrl}/accountlists`, {
            method: 'post',
            json: {
                name: listName,
                enhanced: true,
                segment_group_id: segmentGroupId
            }
        });
        return {
            id: response.data.id,
            name: listName,
            segment_group_id: segmentGroupId
        };
    }
    async addContactToList(userIdentifier, list) {
        return this.request(`${this.apiUrl}/contacts`, {
            method: 'post',
            json: {
                ...userIdentifier,
                [list.name]: true
            }
        });
    }
    async removeContactFromList(userIdentifier, list) {
        return this.request(`${this.apiUrl}/contacts`, {
            method: 'post',
            json: {
                ...userIdentifier,
                [list.name]: false
            }
        });
    }
    async transformAttributes(rawAttributes) {
        const attributes = {};
        const availableAttributes = await this.getAttributes();
        for (const key in availableAttributes) {
            if (key in rawAttributes) {
                const value = rawAttributes[key];
                if (typeof value !== 'object') {
                    attributes[key] = value;
                }
            }
        }
        return attributes;
    }
    async getAttributes() {
        const response = await this.request(`${this.apiUrl}/accountcontactattributes`, {
            method: 'get'
        });
        return response.data;
    }
    prepareListName(listName) {
        return listName.replace(' ', '-');
    }
}
exports.default = CordialClient;
//# sourceMappingURL=cordial-client.js.map