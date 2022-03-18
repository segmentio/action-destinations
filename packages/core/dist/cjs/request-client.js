"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = exports.HTTPError = void 0;
const abort_controller_1 = __importDefault(require("abort-controller"));
const ts_custom_error_1 = require("ts-custom-error");
const fetch_1 = __importStar(require("./fetch"));
const real_type_of_1 = require("./real-type-of");
const isObjectLike = (value) => {
    return value !== null && typeof value === 'object';
};
function mergeHeaders(source1, source2) {
    const result = new fetch_1.Headers(source1 || {});
    const source = new fetch_1.Headers(source2 || {});
    source.forEach((value, key) => {
        if (value === 'undefined') {
            result.delete(key);
        }
        else {
            result.set(key, value);
        }
    });
    return result;
}
function merge(...sources) {
    let result = {};
    let headers = {};
    for (const source of sources) {
        if (Array.isArray(source)) {
            if (!Array.isArray(result)) {
                result = [];
            }
            result = [...result, ...source];
        }
        else if (isObjectLike(source)) {
            for (let [key, value] of Object.entries(source)) {
                if (isObjectLike(value) && key in result) {
                    value = merge(result[key], value);
                }
                result[key] = value;
            }
            if (isObjectLike(source.headers)) {
                headers = mergeHeaders(headers, source.headers);
            }
        }
        result.headers = headers;
    }
    return result;
}
function mergeOptions(...sources) {
    for (const source of sources) {
        if (!real_type_of_1.isObject(source)) {
            throw new TypeError(`The 'options' argument must be an object`);
        }
    }
    return merge({}, ...sources);
}
function getRequestMethod(method) {
    return method.toUpperCase();
}
class HTTPError extends ts_custom_error_1.CustomError {
    constructor(response, request, options) {
        super(response.statusText ?? String(response.status ?? 'Unknown response error'));
        this.response = response;
        this.request = request;
        this.options = options;
    }
}
exports.HTTPError = HTTPError;
class TimeoutError extends ts_custom_error_1.CustomError {
    constructor(request, options) {
        super(`Request timed out`);
        this.request = request;
        this.options = options;
    }
}
exports.TimeoutError = TimeoutError;
function timeoutFetch(request, abortController, options) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            if (abortController) {
                abortController.abort();
            }
            reject(new TimeoutError(request, options));
        }, options.timeout);
        void fetch_1.default(request)
            .then(resolve)
            .catch(reject)
            .then(() => clearTimeout(timer));
    });
}
class RequestClient {
    constructor(url, options = {}) {
        this.setOptions(url, options);
    }
    setOptions(url, options) {
        this.options = {
            ...options,
            method: getRequestMethod(options.method ?? 'get'),
            throwHttpErrors: options.throwHttpErrors !== false,
            timeout: options.timeout ?? 10000
        };
        this.abortController = new abort_controller_1.default();
        if (this.options.signal) {
            this.options.signal.addEventListener('abort', () => {
                this.abortController.abort();
            });
        }
        this.options.signal = this.abortController.signal;
        this.request = new fetch_1.Request(url, this.options);
        if (this.options.searchParams) {
            const searchParams = new URLSearchParams(this.options.searchParams);
            const url = new URL(this.request.url);
            url.search = searchParams.toString();
            this.request = new fetch_1.Request(new fetch_1.Request(url.toString(), this.request), this.options);
        }
        if (this.options.json !== undefined) {
            this.options.body = JSON.stringify(this.options.json);
            this.request.headers.set('content-type', 'application/json');
            this.request = new fetch_1.Request(this.request, { body: this.options.body });
        }
    }
    async executeRequest() {
        let response = await this.fetch();
        for (const hook of this.options.afterResponse ?? []) {
            const modifiedResponse = await hook(this.request, this.options, response);
            if (modifiedResponse instanceof fetch_1.Response) {
                response = modifiedResponse;
            }
        }
        if (!response.ok && this.options.throwHttpErrors) {
            throw new HTTPError(response, this.request, this.options);
        }
        return response;
    }
    async fetch() {
        for (const hook of this.options.beforeRequest ?? []) {
            const newOptions = await hook({ ...this.options });
            if (newOptions && real_type_of_1.isObject(newOptions)) {
                this.setOptions(this.request.url, mergeOptions(this.options, newOptions));
            }
        }
        if (this.options.timeout === false) {
            return fetch_1.default(this.request.clone());
        }
        return timeoutFetch(this.request.clone(), this.abortController, this.options);
    }
}
function createInstance(defaults = {}) {
    const client = (url, options = {}) => new RequestClient(url, mergeOptions(defaults, options)).executeRequest();
    client.extend = (newDefaults) => createInstance(mergeOptions(defaults, newDefaults));
    return client;
}
exports.default = createInstance;
//# sourceMappingURL=request-client.js.map