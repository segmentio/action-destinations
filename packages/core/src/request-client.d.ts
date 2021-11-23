import { CustomError } from 'ts-custom-error';
export interface RequestOptions extends Omit<RequestInit, 'headers'> {
    headers?: Record<string, string>;
    json?: unknown;
    method?: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
    password?: string;
    searchParams?: URLSearchParams | Record<string, string | number | boolean>;
    throwHttpErrors?: boolean;
    timeout?: number | false;
    username?: string;
}
export interface AllRequestOptions extends RequestOptions {
    beforeRequest?: BeforeRequestHook[];
    afterResponse?: AfterResponseHook[];
}
export interface NormalizedOptions extends Omit<AllRequestOptions, 'headers'> {
    headers: RequestInit['headers'];
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
}
declare type MaybePromise<T> = Promise<T> | T;
export declare type BeforeRequestHook = (options: NormalizedOptions) => MaybePromise<RequestOptions | void>;
export declare type AfterResponseHook<OutputResponse extends Response = Response> = (request: Request, options: NormalizedOptions, response: Response) => MaybePromise<OutputResponse | void>;
export declare class HTTPError extends CustomError {
    request: Request;
    response: Response;
    options: NormalizedOptions;
    constructor(response: Response, request: Request, options: NormalizedOptions);
}
export declare class TimeoutError extends CustomError {
    request: Request;
    options: NormalizedOptions;
    constructor(request: Request, options: NormalizedOptions);
}
export default function createInstance(defaults?: AllRequestOptions): {
    <R extends Response = Response>(url: string, options?: RequestOptions): Promise<R>;
    extend(newDefaults: AllRequestOptions): any;
};
export {};
