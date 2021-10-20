import AbortController from 'abort-controller'
import { CustomError } from 'ts-custom-error'
import { URL, URLSearchParams } from 'url'
import fetch, { Headers, Request, Response } from './fetch'
import { isObject } from './real-type-of'

/**
 * The supported request options you can use with the request client
 */
export interface RequestOptions extends Omit<RequestInit, 'headers'> {
  /**
   * Simplified header format to reduce variation
   */
  headers?: Record<string, string>
  /**
   * Shortcut for sending JSON. Use instead of `body`.
   * Accepts any plain object or value, which will be `JSON.stringify()`'d and sent in the body with the correct header set.
   */
  json?: unknown
  /**
   * HTTP method used to make the request.
   * Internally, the standard methods (`GET`, `POST`, `PUT`, `PATCH`, `HEAD` and `DELETE`) are uppercased in order to avoid server errors due to case sensitivity.
   * @default 'get'
   */
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'
  /**
   * When provided, will automatically apply basic authentication
   */
  password?: string
  /**
   * Search parameters to include int he request URL. Setting this will override existing search parameters in the input URL.
   * Accepts [`URLSearchParams()`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams)
   */
  searchParams?: URLSearchParams | Record<string, string | number | boolean>
  /**
   * Throw an error when, after redirects, the response has a non-2xx status code.
   * @default true
   */
  throwHttpErrors?: boolean
  /**
   * Timeout in milliseconds for getting a response.
   * If set to `false` there will be no timeout.
   * @default 10000
   */
  timeout?: number | false
  /**
   * When provided, will automatically apply basic authentication
   */
  username?: string
}

/**
 * All request options including before/after hooks
 */
export interface AllRequestOptions extends RequestOptions {
  /**
   * Hooks that execute before a request is sent.
   * Useful to modify the options that a request will use
   */
  beforeRequest?: BeforeRequestHook[]
  /**
   * Hooks that executes after a response is received.
   * Useful for logging, cleanup, or modifying the response object
   */
  afterResponse?: AfterResponseHook[]
}

export interface NormalizedOptions extends Omit<AllRequestOptions, 'headers'> {
  // the merging process turns these into a Headers object, but you can pass in more
  headers: RequestInit['headers']
  // method is expected to be defined at this point
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'
}

type MaybePromise<T> = Promise<T> | T

/** A hook that executes before a request is executed. Useful to modify the options that a request will use */
export type BeforeRequestHook = (options: NormalizedOptions) => MaybePromise<RequestOptions | void>

/** A hook that executes after a response is received. Useful for logging, cleanup, or modifying the response object */
export type AfterResponseHook<OutputResponse extends Response = Response> = (
  request: Request,
  options: NormalizedOptions,
  response: Response
) => MaybePromise<OutputResponse | void>

// We need the loose definition of "object" to iterate over things like `[object Headers]`
const isObjectLike = (value: unknown): value is { [key: string]: unknown } => {
  return value !== null && typeof value === 'object'
}

/** Merges two sets of headers intelligently */
function mergeHeaders(source1: RequestInit['headers'], source2: RequestInit['headers']) {
  const result = new Headers(source1 || {})
  const source = new Headers(source2 || {})

  source.forEach((value, key) => {
    // `value` may be the string `undefined` when the source is a Headers object
    if (value === 'undefined') {
      result.delete(key)
    } else {
      result.set(key, value)
    }
  })

  return result
}

/** Deeply merge multiple objects or arrays. Arrays get concatenated. */
function merge<T>(...sources: T[]): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = {}
  let headers: RequestInit['headers'] = {}

  for (const source of sources) {
    if (Array.isArray(source)) {
      if (!Array.isArray(result)) {
        result = []
      }

      // Concatenate arrays (e.g. hooks)
      result = [...result, ...source]
    } else if (isObjectLike(source)) {
      // eslint-disable-next-line prefer-const
      for (let [key, value] of Object.entries(source)) {
        // Recurse over objects
        if (isObjectLike(value) && key in result) {
          value = merge(result[key], value)
        }

        // Update the key's value in our copy
        result[key] = value
      }

      // Merge headers more carefully to handle duplicates
      if (isObjectLike(source.headers)) {
        headers = mergeHeaders(headers, source.headers as RequestInit['headers'])
      }
    }

    // Assign after we've merged all the headers because they are handled specially
    result.headers = headers
  }

  return result as T
}

/**
 * Validates and merges request options
 */
function mergeOptions(...sources: Array<NormalizedOptions | AllRequestOptions>): AllRequestOptions {
  for (const source of sources) {
    if (!isObject(source)) {
      throw new TypeError(`The 'options' argument must be an object`)
    }
  }

  return merge({}, ...sources) as AllRequestOptions
}

function getRequestMethod<T extends string>(method: T): T {
  return method.toUpperCase() as T
}

/** Error thrown when a response has a non-2xx response. */
export class HTTPError extends CustomError {
  request: Request
  response: Response
  options: NormalizedOptions

  constructor(response: Response, request: Request, options: NormalizedOptions) {
    super(response.statusText ?? String(response.status ?? 'Unknown response error'))
    this.response = response
    this.request = request
    this.options = options
  }
}

/** Error thrown when a request is aborted because of a client timeout. */
export class TimeoutError extends CustomError {
  request: Request
  options: NormalizedOptions

  constructor(request: Request, options: NormalizedOptions) {
    super(`Request timed out`)
    this.request = request
    this.options = options
  }
}

/**
 * Given a request, reject the request when a timeout is exceeded
 */
function timeoutFetch(
  request: Request,
  abortController: AbortController,
  options: NormalizedOptions
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (abortController) {
        abortController.abort()
      }

      reject(new TimeoutError(request, options))
    }, options.timeout as number)

    void fetch(request)
      .then(resolve)
      .catch(reject)
      .then(() => clearTimeout(timer))
  })
}

class RequestClient {
  private abortController: AbortController
  private request: Request
  private options: NormalizedOptions

  constructor(url: string, options: AllRequestOptions = {}) {
    this.setOptions(url, options)
  }

  private setOptions(url: string, options: AllRequestOptions) {
    this.options = {
      ...options,
      method: getRequestMethod(options.method ?? 'get'),
      throwHttpErrors: options.throwHttpErrors !== false,
      timeout: options.timeout ?? 10000
    } as NormalizedOptions

    // Timeout support. Use our own abort controller so consumers can pass in their own `signal`
    // if they wish to use timeouts alongside other logic to abort a request
    this.abortController = new AbortController()
    if (this.options.signal) {
      // Listen to consumer abort events to also abort our internal controller
      this.options.signal.addEventListener('abort', () => {
        this.abortController.abort()
      })
    }

    // Use our internal abort controller for fetch
    this.options.signal = this.abortController.signal

    // Construct a request object to send to the Fetch API
    this.request = new Request(url, this.options)

    // Parse search params and merge them with the request URL
    if (this.options.searchParams) {
      // The type is a bit too restrictive, since you can pass in other primitives like `{ foo: 1, bar: true }`
      const searchParams = new URLSearchParams(this.options.searchParams as URLSearchParams | Record<string, string>)
      const url = new URL(this.request.url)
      url.search = searchParams.toString()

      // Update the request object with the new url including the search params
      this.request = new Request(new Request(url.toString(), this.request), this.options)
    }

    // Automatically handle json header + stringification as a convenience when using `json` option
    if (this.options.json !== undefined) {
      this.options.body = JSON.stringify(this.options.json)
      this.request.headers.set('content-type', 'application/json')
      this.request = new Request(this.request, { body: this.options.body })
    }
  }

  async executeRequest<T extends Response>(): Promise<T> {
    let response = await this.fetch()

    for (const hook of this.options.afterResponse ?? []) {
      const modifiedResponse = await hook(this.request, this.options, response)
      if (modifiedResponse instanceof Response) {
        response = modifiedResponse
      }
    }

    if (!response.ok && this.options.throwHttpErrors) {
      throw new HTTPError(response, this.request, this.options)
    }

    return response as T
  }

  /**
   * Make a fetch request, running all beforeRequest hooks, and optionally wrap in a timeout
   */
  private async fetch() {
    for (const hook of this.options.beforeRequest ?? []) {
      const newOptions = await hook({ ...this.options })
      if (newOptions && isObject(newOptions)) {
        this.setOptions(this.request.url, mergeOptions(this.options, newOptions))
      }
    }

    if (this.options.timeout === false) {
      return fetch(this.request.clone())
    }

    return timeoutFetch(this.request.clone(), this.abortController, this.options)
  }
}

/**
 * Creates a new instance of the fetch request client,
 * optionally with default configuration to apply to all requests made with the client
 */
export default function createInstance(defaults: AllRequestOptions = {}) {
  const client = <R extends Response = Response>(url: string, options: RequestOptions = {}) =>
    new RequestClient(url, mergeOptions(defaults, options)).executeRequest<R>()
  client.extend = (newDefaults: AllRequestOptions) => createInstance(mergeOptions(defaults, newDefaults))
  return client
}
