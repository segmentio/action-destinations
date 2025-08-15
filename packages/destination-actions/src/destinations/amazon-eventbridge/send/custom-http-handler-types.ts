export interface HttpRequest {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | undefined
  hostname: string
  path: string
  headers: Record<string, string>
  body?: unknown
}

export interface HttpResponse {
  statusCode: number
  headers: Record<string, string>
  body?: unknown
}

export interface HttpHandler {
  handle(request: HttpRequest, options?: unknown): Promise<{ response: HttpResponse }>
}