import { DecoratedResponse as Response } from '@segment/actions-core'

export interface Exchange {
  request: RequestToDestination
  response: ResponseFromDestination
}

export interface RequestToDestination {
  url: string
  headers: { [key: string]: string } // JSON.strigify() does not work for request headers
  method: string
  body: unknown
}

export interface ResponseFromDestination {
  statusCode: number
  statusMessage?: string
  headers: Headers
  body: unknown
}

export default async function getExchanges(responses: Response[]): Promise<Exchange[]> {
  const requests: Exchange[] = []

  for (const response of responses) {
    requests.push({
      request: await summarizeRequest(response),
      response: summarizeResponse(response)
    })
  }

  return requests
}

async function summarizeRequest(response: Response): Promise<RequestToDestination> {
  const request = response.request.clone()
  const data = await request.text()

  // List of headers that may contain sensitive information
  const sensitiveHeaders = [
    'authorization',
    'proxy-authorization',
    'cookie',
    'set-cookie',
    'www-authenticate',
    'proxy-authenticate',
    'x-csrf-token',
    'x-xsrf-token',
    'x-api-key',
    'x-client-id',
    'x-uid',
    'x-requested-with',
    'x-forwarded-for',
    'x-real-ip',
    'x-amz-security-token',
    'x-amz-content-sha256',
    'x-amz-date',
    'x-amz-user-agent'
  ]

  // Convert headers to plain JavaScript object and redact sensitive headers
  const headersObject: { [key: string]: string } = {}
  request.headers.forEach((value, key) => {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      headersObject[key] = '<redacted>'
    } else {
      headersObject[key] = value
    }
  })

  return {
    url: request.url,
    method: request.method,
    headers: headersObject,
    body: data ?? ''
  }
}

function summarizeResponse(response: Response): ResponseFromDestination {
  return {
    statusCode: response.status,
    statusMessage: response.statusText,
    headers: response.headers,
    body: response.data ?? response
  }
}
