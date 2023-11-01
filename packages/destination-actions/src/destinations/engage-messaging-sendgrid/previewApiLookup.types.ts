// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The id of the API lookup for use in logging & observability
   */
  id?: string
  /**
   * The name of the API lookup referenced in liquid syntax
   */
  name: string
  /**
   * The URL endpoint to call
   */
  url: string
  /**
   * The request method, e.g. GET/POST/etc.
   */
  method: string
  /**
   * The cache TTL in ms
   */
  cacheTtl: number
  /**
   * The request body for use with POST/PUT/PATCH requests
   */
  body?: string
  /**
   * Headers in JSON to be sent with the request
   */
  headers?: {
    [k: string]: unknown
  }
  /**
   * The response type of the request. Currently only supporting JSON.
   */
  responseType: string
  /**
   * A user profile's traits
   */
  traits?: {
    [k: string]: unknown
  }
}
