import { EventEmitter } from 'events';
import createRequestClient from '../create-request-client';
import { transform, transformBatch } from '../mapping-kit';
import { fieldsToJsonSchema } from './fields-to-jsonschema';
import { Response } from '../fetch';
import { validateSchema } from '../schema-validation';
import { IntegrationError } from '../errors';
import { removeEmptyValues } from '../remove-empty-values';
export class Action extends EventEmitter {
    constructor(destinationName, definition, extendRequest) {
        super();
        this.definition = definition;
        this.destinationName = destinationName;
        this.extendRequest = extendRequest;
        this.hasBatchSupport = typeof definition.performBatch === 'function';
        if (Object.keys(definition.fields ?? {}).length) {
            this.schema = fieldsToJsonSchema(definition.fields);
        }
    }
    async execute(bundle) {
        const results = [];
        let payload = transform(bundle.mapping, bundle.data);
        results.push({ output: 'Mappings resolved' });
        payload = removeEmptyValues(payload, this.schema, true);
        if (this.schema) {
            const schemaKey = `${this.destinationName}:${this.definition.title}`;
            validateSchema(payload, this.schema, { schemaKey });
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
            throw new IntegrationError('This action does not support batched requests.', 'NotImplemented', 501);
        }
        let payloads = transformBatch(bundle.mapping, bundle.data);
        if (this.schema) {
            const schema = this.schema;
            const validationOptions = {
                schemaKey: `${this.destinationName}:${this.definition.title}`,
                throwIfInvalid: false
            };
            payloads = payloads
                .map((payload) => removeEmptyValues(payload, schema))
                .filter((payload) => validateSchema(payload, schema, validationOptions));
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
        return createRequestClient(options, {
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
        if (response instanceof Response) {
            return response.data ?? response.content;
        }
        return response;
    }
}
//# sourceMappingURL=action.js.map