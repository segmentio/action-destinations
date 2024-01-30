import { RequestClient, RetryableError, ModifiedResponse } from '@segment/actions-core'
import { Settings } from './settings'

const TEST_ENDPOINT = 'https://evt-iad-test.rmp-api.moloco.com/cdp/SEGMENT'

export class MolocoAPIClient {
    url: string
    platform: string
    apiKey: string

    request: RequestClient

    constructor(request: RequestClient, settings: Settings) {
        this.url = this.getEndpoint()
        this.platform = settings.platform
        this.apiKey = settings.apiKey
    
        this.request = request
    }

    // TODO: return dynamic endpoint based on the platform
    getEndpoint() {
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

        if (res.status === 200) {
            return res
        }

        // TODO: elaborate on the error classification and its message
        throw new RetryableError(`Error while sending event to Moloco RMP API`)
    }
}