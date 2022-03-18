"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Action = void 0;
const events_1 = require("events");
const create_request_client_1 = __importDefault(require("../create-request-client"));
const mapping_kit_1 = require("../mapping-kit");
const fields_to_jsonschema_1 = require("./fields-to-jsonschema");
const fetch_1 = require("../fetch");
const schema_validation_1 = require("../schema-validation");
const errors_1 = require("../errors");
const remove_empty_values_1 = require("../remove-empty-values");
class Action extends events_1.EventEmitter {
    constructor(destinationName, definition, extendRequest) {
        super();
        this.definition = definition;
        this.destinationName = destinationName;
        this.extendRequest = extendRequest;
        this.hasBatchSupport = typeof definition.performBatch === 'function';
        if (Object.keys(definition.fields ?? {}).length) {
            this.schema = fields_to_jsonschema_1.fieldsToJsonSchema(definition.fields);
        }
    }
    async execute(bundle) {
        const results = [];
        let payload = mapping_kit_1.transform(bundle.mapping, bundle.data);
        results.push({ output: 'Mappings resolved' });
        payload = remove_empty_values_1.removeEmptyValues(payload, this.schema, true);
        if (this.schema) {
            const schemaKey = `${this.destinationName}:${this.definition.title}`;
            schema_validation_1.validateSchema(payload, this.schema, { schemaKey });
            results.push({ output: 'Payload validated' });
        }
        const dataBundle = {
            rawData: bundle.data,
            rawMapping: bundle.mapping,
            settings: bundle.settings,
            payload,
            auth: bundle.auth
        };
        const output = await this.performRequest(this.definition.perform, dataBundle);
        results.push({ output: output });
        return results;
    }
    async executeBatch(bundle) {
        if (!this.hasBatchSupport) {
            throw new errors_1.IntegrationError('This action does not support batched requests.', 'NotImplemented', 501);
        }
        let payloads = mapping_kit_1.transformBatch(bundle.mapping, bundle.data);
        if (this.schema) {
            const schema = this.schema;
            const validationOptions = {
                schemaKey: `${this.destinationName}:${this.definition.title}`,
                throwIfInvalid: false
            };
            payloads = payloads
                .map((payload) => remove_empty_values_1.removeEmptyValues(payload, schema))
                .filter((payload) => schema_validation_1.validateSchema(payload, schema, validationOptions));
        }
        if (payloads.length === 0) {
            return;
        }
        if (this.definition.performBatch) {
            const data = {
                rawData: bundle.data,
                rawMapping: bundle.mapping,
                settings: bundle.settings,
                payload: payloads,
                auth: bundle.auth
            };
            await this.performRequest(this.definition.performBatch, data);
        }
    }
    executeDynamicField(field, data) {
        const fn = this.definition.dynamicFields?.[field];
        if (typeof fn !== 'function') {
            return {
                data: [],
                pagination: {}
            };
        }
        return this.performRequest(fn, data);
    }
    async performRequest(requestFn, data) {
        const requestClient = this.createRequestClient(data);
        const response = await requestFn(requestClient, data);
        return this.parseResponse(response);
    }
    createRequestClient(data) {
        const options = this.extendRequest?.(data) ?? {};
        return create_request_client_1.default(options, {
            afterResponse: [this.afterResponse.bind(this)]
        });
    }
    afterResponse(request, options, response) {
        const modifiedResponse = response;
        modifiedResponse.request = request;
        modifiedResponse.options = options;
        this.emit('response', modifiedResponse);
        return modifiedResponse;
    }
    parseResponse(response) {
        if (response instanceof fetch_1.Response) {
            return response.data ?? response.content;
        }
        return response;
    }
}
exports.Action = Action;
//# sourceMappingURL=action.js.map