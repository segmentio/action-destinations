"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_1 = __importDefault(require("lodash/get"));
const searchFieldMap = {
    deal: 'dealField',
    person: 'personField',
    product: 'productField',
    organization: 'organizationField'
};
const pipedriveFieldMap = {
    ...searchFieldMap,
    activity: 'activityFields',
    note: 'noteFields'
};
const cache = {};
class PipedriveClient {
    constructor(settings, request) {
        this.settings = settings;
        this._request = request;
    }
    async getId(item, fieldName, term) {
        if (!term) {
            return null;
        }
        const searchParams = {
            term,
            field_key: fieldName,
            exact_match: true,
            field_type: searchFieldMap[item]
        };
        let result = null;
        try {
            const search = await this._request(`https://${this.settings.domain}.pipedrive.com/api/v1/itemSearch/field`, {
                searchParams: {
                    ...searchParams,
                    exact_match: true,
                    return_item_ids: true
                }
            });
            result = get_1.default(search, 'data.data[0].id', null);
        }
        catch (e) {
            return result;
        }
        return result;
    }
    async getFields(item) {
        const cachedFields = get_1.default(cache, item, []);
        if (cachedFields.length > 0) {
            return cachedFields;
        }
        const response = await this._request(`https://${this.settings.domain}.pipedrive.com/api/v1/${pipedriveFieldMap[item]}`);
        const body = response.data;
        const fields = body.data.map((f) => ({
            label: f.name,
            value: f.key
        }));
        const record = {
            body: {
                data: fields,
                pagination: {}
            }
        };
        cachedFields[item] = record;
        return record;
    }
    async getActivityTypes() {
        const response = await this._request(`https://${this.settings.domain}.pipedrive.com/api/v1/activityTypes`);
        const activityTypes = response.data;
        const fields = activityTypes.data.map((f) => ({
            label: f.name,
            value: f.key_string
        }));
        const record = {
            body: {
                data: fields,
                pagination: {}
            }
        };
        return record;
    }
    async createUpdate(itemPath, item) {
        if (item.id) {
            const id = item.id;
            delete item['id'];
            return this.put(`${itemPath}/${id}`, item);
        }
        return this.post(itemPath, item);
    }
    async post(path, payload) {
        return this.reqWithPayload(path, payload, 'post');
    }
    async put(path, payload) {
        return this.reqWithPayload(path, payload, 'put');
    }
    async reqWithPayload(path, payload, method) {
        PipedriveClient.filterPayload(payload);
        const urlBase = `https://${this.settings.domain}.pipedrive.com/api/v1`;
        return this._request(`${urlBase}/${path}`, {
            method: method,
            json: payload
        });
    }
    static filterPayload(payload) {
        Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
    }
    static fieldHandler(fieldType) {
        return async (request, { settings }) => {
            const client = new PipedriveClient(settings, request);
            return client.getFields(fieldType);
        };
    }
}
exports.default = PipedriveClient;
//# sourceMappingURL=pipedrive-client.js.map