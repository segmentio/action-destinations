import AbortController from 'abort-controller';
import { CustomError } from 'ts-custom-error';
import fetch, { Headers, Request, Response } from './fetch';
import { isObject } from './real-type-of';
const isObjectLike = (value) => {
    return value !== null && typeof value === 'object';
};
function mergeHeaders(source1, source2) {
    const result = new Headers(source1 || {});
    const source = new Headers(source2 || {});
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
        if (!isObject(source)) {
            throw new TypeError(`The 'options' argument must be an object`);
        }
    }
    return merge({}, ...sources);
}
function getRequestMethod(method) {
    return method.toUpperCase();
}
export class HTTPError extends CustomError {
    constructor(response, request, options) {
        super(response.statusText ?? String(response.status ?? 'Unknown response error'));
        this.response = response;
        this.request = request;
        this.options = options;
    }
}
export class TimeoutError extends CustomError {
    constructor(request, options) {
        super(`Request timed out`);
        this.request = request;
        this.options = options;
    }
}
function timeoutFetch(request, abortController, options) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            if (abortController) {
                abortController.abort();
            }
            reject(new TimeoutError(request, options));
        }, options.timeout);
        void fetch(request)
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
        this.abortController = new AbortController();
        if (this.options.signal) {
            this.options.signal.addEventListener('abort', () => {
                this.abortController.abort();
            });
        }
        this.options.signal = this.abortController.signal;
        this.request = new Request(url, this.options);
        if (this.options.searchParams) {
            const searchParams = new URLSearchParams(this.options.searchParams);
            const url = new URL(this.request.url);
            url.search = searchParams.toString();
            this.request = new Request(new Request(url.toString(), this.request), this.options);
        }
        if (this.options.json !== undefined) {
            this.options.body = JSON.stringify(this.options.json);
            this.request.headers.set('content-type', 'application/json');
            this.request = new Request(this.request, { body: this.options.body });
        }
    }
    async executeRequest() {
        let response = await this.fetch();
        for (const hook of this.options.afterResponse ?? []) {
            const modifiedResponse = await hook(this.request, this.options, response);
            if (modifiedResponse instanceof Response) {
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
            if (newOptions && isObject(newOptions)) {
                this.setOptions(this.request.url, mergeOptions(this.options, newOptions));
            }
        }
        if (this.options.timeout === false) {
            return fetch(this.request.clone());
        }
        return timeoutFetch(this.request.clone(), this.abortController, this.options);
    }
}
export default function createInstance(defaults = {}) {
    const client = (url, options = {}) => new RequestClient(url, mergeOptions(defaults, options)).executeRequest();
    client.extend = (newDefaults) => createInstance(mergeOptions(defaults, newDefaults));
    return client;
}
//# sourceMappingURL=request-client.js.map