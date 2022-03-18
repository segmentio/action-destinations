"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_VERSION = void 0;
const actions_core_1 = require("@segment/actions-core");
const sf_object_to_shape_1 = require("./sf-object-to-shape");
exports.API_VERSION = 'v53.0';
class Salesforce {
    constructor(instanceUrl, request) {
        this.createRecord = async (payload, sobject) => {
            const json = this.buildJSONData(payload, sobject);
            return this.request(`${this.instanceUrl}services/data/${exports.API_VERSION}/sobjects/${sobject}`, {
                method: 'post',
                json: json
            });
        };
        this.updateRecord = async (payload, sobject) => {
            if (!payload.traits || Object.keys(payload.traits).length === 0) {
                throw new actions_core_1.IntegrationError('Undefined Traits when using update operation', 'Undefined Traits', 400);
            }
            if (Object.keys(payload.traits).includes('Id') && payload.traits['Id']) {
                return await this.baseUpdate(payload.traits['Id'], sobject, payload);
            }
            const [recordId, err] = await this.lookupTraits(payload.traits, sobject);
            if (err) {
                throw err;
            }
            return await this.baseUpdate(recordId, sobject, payload);
        };
        this.upsertRecord = async (payload, sobject) => {
            if (!payload.traits || Object.keys(payload.traits).length === 0) {
                throw new actions_core_1.IntegrationError('Undefined Traits when using upsert operation', 'Undefined Traits', 400);
            }
            const [recordId, err] = await this.lookupTraits(payload.traits, sobject);
            if (err) {
                if (err.status === 404) {
                    return await this.createRecord(payload, sobject);
                }
                throw err;
            }
            return await this.baseUpdate(recordId, sobject, payload);
        };
        this.baseUpdate = async (recordId, sobject, payload) => {
            const json = this.buildJSONData(payload, sobject);
            return this.request(`${this.instanceUrl}services/data/${exports.API_VERSION}/sobjects/${sobject}/${recordId}`, {
                method: 'patch',
                json: json
            });
        };
        this.buildJSONData = (payload, sobject) => {
            let baseShape = {};
            if (!payload.customObjectName) {
                baseShape = sf_object_to_shape_1.mapObjectToShape(payload, sobject);
            }
            if (payload.customFields) {
                baseShape = { ...baseShape, ...payload.customFields };
            }
            return baseShape;
        };
        this.escapeQuotes = (value) => value.replace(/'/g, "\\'");
        this.removeInvalidChars = (value) => value.replace(/[^a-zA-Z0-9_]/g, '');
        this.buildQuery = (traits, sobject) => {
            let soql = `SELECT Id FROM ${sobject} WHERE `;
            const entries = Object.entries(traits);
            let i = 0;
            for (const [key, value] of entries) {
                let token = `${this.removeInvalidChars(key)} = '${this.escapeQuotes(value)}'`;
                if (i < entries.length - 1) {
                    token += ' OR ';
                }
                soql += token;
                i += 1;
            }
            return soql;
        };
        this.lookupTraits = async (traits, sobject) => {
            const SOQLQuery = encodeURIComponent(this.buildQuery(traits, sobject));
            const res = await this.request(`${this.instanceUrl}services/data/${exports.API_VERSION}/query/?q=${SOQLQuery}`, { method: 'GET' });
            if (!res || !res.data || res.data.totalSize === undefined) {
                return ['', new actions_core_1.IntegrationError('Response missing expected fields', 'Bad Response', 400)];
            }
            if (res.data.totalSize === 0) {
                return ['', new actions_core_1.IntegrationError('No record found with given traits', 'Record Not Found', 404)];
            }
            if (res.data.totalSize > 1) {
                return ['', new actions_core_1.IntegrationError('Multiple records returned with given traits', 'Multiple Records Found', 300)];
            }
            if (!res.data.records || !res.data.records[0] || !res.data.records[0].Id) {
                return ['', new actions_core_1.IntegrationError('Response missing expected fields', 'Bad Response', 400)];
            }
            return [res.data.records[0].Id, undefined];
        };
        this.instanceUrl = instanceUrl.concat(instanceUrl.slice(-1) === '/' ? '' : '/');
        this.request = request;
    }
}
exports.default = Salesforce;
//# sourceMappingURL=sf-operations.js.map