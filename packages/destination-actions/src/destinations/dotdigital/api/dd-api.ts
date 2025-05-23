import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'

abstract class DDApi {
  private readonly apiUrl: string
  private readonly request: RequestClient

  protected constructor(settings: Settings, request: RequestClient) {
    this.apiUrl = settings.api_host
    this.request = request
  }

  /**
   * Generic GET method
   * @param endpoint - The API endpoint to call.
   * @param params - An object containing query parameters.
   *
   * @returns A an object of type TResponse containing the response data.
   */
  protected async get<TResponse>(endpoint: string, params?: Record<string, unknown>) {
    const url = new URL(`${this.apiUrl}${endpoint}`)
    if (params) {
      url.search = new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
      ).toString()
    }
    return await this.request<TResponse>(`${url}`, {
      method: 'GET'
    })
  }

  /**
   * Generic POST method
   * @param endpoint - The API endpoint to call.
   * @param data - The data to send in the client body.
   *
   * @returns an object of type TResponse containing the response data.
   */
  protected async post<ResponseType, RequestJSON>(endpoint: string, data: RequestJSON) {
    return await this.request<ResponseType>(`${this.apiUrl}${endpoint}`, {
      method: 'POST',
      json: data,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Generic DELETE method
   * @param endpoint - The API endpoint to call.
   */
  protected async delete(endpoint: string) {
    return await this.request(`${this.apiUrl}${endpoint}`, {
      method: 'DELETE'
    })
  }

  /**
   * Generic PATCH method
   * @param endpoint - The API endpoint to call.
   * @param data - The data to send in the client body.
   *
   * @returns an object of type TResponse containing the response data.
   */
  protected async patch<ResponseType, RequestJSON>(endpoint: string, data: RequestJSON) {
    return await this.request<ResponseType>(`${this.apiUrl}${endpoint}`, {
      method: 'PATCH',
      json: data,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export default DDApi
