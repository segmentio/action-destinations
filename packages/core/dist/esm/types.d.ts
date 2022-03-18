export interface ModifiedResponse<T = unknown> extends Response {
  content: string
  data: unknown extends T ? undefined | unknown : T
  headers: Headers & {
    toJSON: () => Record<string, string>
  }
}
