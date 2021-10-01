import { DecoratedResponse as Response } from '@segment/actions-core'

export interface Exchange {
  request: RequestToDestination
  response: ResponseFromDestination
}

export interface RequestToDestination {
  url: string
  headers: Headers
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

  return {
    url: request.url,
    method: request.method,
    headers: request.headers,
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
