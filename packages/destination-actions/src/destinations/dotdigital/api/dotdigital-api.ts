import { APIError, RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'

abstract class DotdigitalApi {
  private readonly apiUrl: string
  private readonly client: RequestClient

  protected constructor(settings: Settings, client: RequestClient) {
    this.apiUrl = settings.api_host
    this.client = client
  }

  /**
   * Generic GET method
   * @param endpoint - The API endpoint to call.
   * @param params - An object containing query parameters.
   *
   * @returns A promise that resolves to a DecoratedResponse.
   */
  protected async get<T>(endpoint: string, params?: T): Promise<ModifiedResponse> {
    try {
      const url = new URL(`${this.apiUrl}${endpoint}`)
      if (params) {
        url.search = new URLSearchParams(params).toString();
      }
      return await this.client(`${url}`, {
        method: 'GET'
      })
    } catch (error) {
      throw (error as APIError) ?? 'GET request failed'
    }
  }

  /**
   * Generic POST method
   * @param endpoint - The API endpoint to call.
   * @param data - The data to send in the client body.
   *
   * @returns A promise that resolves to a DecoratedResponse.
   */
  protected async post<T>(endpoint: string, data: T): Promise<ModifiedResponse> {
    try {
      return await this.client(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      throw (error as APIError) ?? 'POST request failed'
    }
  }

  /**
   * Generic DELETE method
   * @param endpoint - The API endpoint to call.
   *
   * @returns A promise that resolves to a DecoratedResponse.
   */
  protected async delete(endpoint: string): Promise<ModifiedResponse> {
    try {
      return await this.client(`${this.apiUrl}${endpoint}`, {
        method: 'DELETE'
      })
    } catch (error) {
      throw (error as APIError) ?? 'DELETE request failed'
    }
  }

  /**
   * Generic PATCH method
   * @param endpoint - The API endpoint to call.
   * @param data - The data to send in the client body.
   *
   * @returns A promise that resolves to a DecoratedResponse.
   */
  protected async patch<T>(endpoint: string, data: T): Promise<ModifiedResponse> {
    try {
      return await this.client(`${this.apiUrl}${endpoint}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      throw (error as APIError) ?? 'PATCH request failed'
    }
  }
}

export default DotdigitalApi
