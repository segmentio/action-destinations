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
export default function getExchanges(responses: Response[]): Promise<Exchange[]>
