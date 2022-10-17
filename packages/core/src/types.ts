/** A modified response object that is handled by the `prepareResponse` hook */
export interface ModifiedResponse<T = unknown> extends Response {
  /** The raw response content as a string – same as `await response.text()` */
  content: string
  /** The parsed content string into a JavaScript object, if applicable */
  data: unknown extends T ? undefined | unknown : T
  /** The headers object with a shortcut method to get headers as an object */
  headers: Headers & {
    toJSON: () => Record<string, string>
  }
}
