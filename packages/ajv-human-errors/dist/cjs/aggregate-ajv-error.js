"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateAjvError = exports.AjvError = void 0;
const formatting_1 = require("./formatting");
const util_1 = require("./util");
const defaultOpts = {
    fieldLabels: 'title',
    includeOriginalError: false,
    includeData: false
};
class AjvError extends Error {
    constructor(ajvErr, options = {}) {
        super();
        this.options = {};
        this.redundant = false;
        this.options = {
            ...defaultOpts,
            ...options
        };
        this.pointer = ajvErr.instancePath;
        this.path = util_1.jsonPath(ajvErr.instancePath);
        const message = formatting_1.getMessage(ajvErr, this.options);
        if (message === null) {
            this.redundant = true;
            return;
        }
        this.message = `${util_1.capitalize(message)}.`;
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
exports.AjvError = AjvError;
class AggregateAjvError extends Error {
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
exports.AggregateAjvError = AggregateAjvError;
//# sourceMappingURL=aggregate-ajv-error.js.map