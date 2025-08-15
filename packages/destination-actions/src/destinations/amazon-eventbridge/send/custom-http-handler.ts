import { RequestClient } from '@segment/actions-core'
import { HttpHandler, HttpResponse, HttpRequest } from './custom-http-handler-types'

export const createCustomHandler = (requestClient: RequestClient): HttpHandler => ({
  handle: async (request: HttpRequest, _options?: unknown): Promise<{ response: HttpResponse }> => {
    const url = `https://${request.hostname}${request.path}`

    let body: BodyInit | null = null
    if (request.body !== undefined) {
      body = typeof request.body === "string" ? request.body : JSON.stringify(request.body)
    }

    const result = await requestClient(url, {
        method: request.method, 
        headers: request.headers,
        body
    })

    let headers: Record<string, string> = {}
    if (typeof result.headers.toJSON === 'function') {
      headers = result.headers.toJSON() as unknown as Record<string, string>
    } else if (result.headers && typeof result.headers === 'object') {
      headers = result.headers as unknown as Record<string, string>
    }

    return {
      response: {
        statusCode: result.status,
        headers,
        body: result.body
      }
    }
  }
})