import { getMessage } from './formatting';
import { capitalize, jsonPath } from './util';
const defaultOpts = {
    fieldLabels: 'title',
    includeOriginalError: false,
    includeData: false
};
export class AjvError extends Error {
    constructor(ajvErr, options = {}) {
        super();
        this.options = {};
        this.redundant = false;
        this.options = {
            ...defaultOpts,
            ...options
        };
        this.pointer = ajvErr.instancePath;
        this.path = jsonPath(ajvErr.instancePath);
        const message = getMessage(ajvErr, this.options);
        if (message === null) {
            this.redundant = true;
            return;
        }
        this.message = `${capitalize(message)}.`;
        if (this.options.includeOriginalError) {
            this.original = ajvErr;
        }
        if (this.options.includeData) {
            this.data = ajvErr.data;
        }
    }
    toJSON() {
        const humanError = {
            path: this.path,
            pointer: this.pointer,
            message: this.message
        };
        if (this.options.includeOriginalError) {
            humanError.original = this.original;
        }
        if (this.options.includeData) {
            humanError.data = this.data;
        }
        return humanError;
    }
}
export class AggregateAjvError extends Error {
    constructor(ajvErrors, opts = {}) {
        super();
        this.name = 'AggregateAjvError';
        this.errors = (ajvErrors !== null && ajvErrors !== void 0 ? ajvErrors : []).map((error) => new AjvError(error, opts)).filter((error) => !error.redundant);
        this.message = this.errors.map((error) => error.message).join(' ');
    }
    toJSON() {
        return this.errors.map((error) => error.toJSON());
    }
    *[Symbol.iterator]() {
        for (const err of this.errors) {
            yield err;
        }
    }
}
//# sourceMappingURL=aggregate-ajv-error.js.map