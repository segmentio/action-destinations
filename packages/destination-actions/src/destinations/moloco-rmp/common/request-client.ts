import { 
    InvalidAuthenticationError,
    APIError,
    RequestClient,
    RetryableError,
    ModifiedResponse
} from '@segment/actions-core'
import type { Settings } from './settings'

const TEST_ENDPOINT = 'https://evt-sel-test.rmp-api.moloco.com/cdp/SEGMENT'

export class MolocoAPIClient {
    url: string
    platform: string
    apiKey: string

    request: RequestClient

    constructor(request: RequestClient, settings: Settings) {
        this.url = this.getEndpoint()
        this.platform = settings.platformId
        this.apiKey = settings.apiKey
    
        this.request = request
    }

    // TODO: return dynamic endpoint based on the platform
    private getEndpoint() {
        return TEST_ENDPOINT
    }

    private async _sendEvent(body: Record<string, any>): Promise<ModifiedResponse> {
        const headers = {
            'x-api-key': this.apiKey,
            'x-platform-id': this.platform,
            'Content-Type': 'application/json'
        }

        return await this.request(this.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        })
    }

    async sendEvent(body: Record<string, any>): Promise<ModifiedResponse> {
        const res = await this._sendEvent(body)

        // OK
        if (res.status === 200) {
            return res
        } else {
            const errorMsg = await res.text();

            // Retry on 5xx (server errors) and 429s (rate limits)
            if (res.status >= 500 || res.status === 429) {
                throw new RetryableError(`${res.status} | ${errorMsg}, this will be retried`)
            }

            // Unauthorized errors, could be invalid platform or API Key
            if (res.status === 401) {
                throw new InvalidAuthenticationError(`${res.status} | Unauthorized: ${errorMsg}`)
            }

            // Invalid payload
            if (res.status === 400) {
                throw new APIError(`${res.status} | Invalid payload: ${errorMsg}`, res.status)
            }

            // Else, throw a non-retryable error
            throw new Error(`${res.status}' | Unknown error: ${errorMsg}`)
        }
    }
}