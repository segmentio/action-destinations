import { 
    RequestClient,
    ModifiedResponse
} from '@segment/actions-core'
import type { Settings } from '../generated-types'

export class MolocoAPIClient {
    url: string
    platform: string
    apiKey: string

    request: RequestClient

    constructor(request: RequestClient, settings: Settings) {
        this.platform = settings.platformId
        this.apiKey = settings.apiKey
        this.request = request

        this.url = this.getEndpoint()
    }

    private getEndpoint() {
        return `https://${this.platform.replace(/_/g, '-')}-evt.rmp-api.moloco.com/cdp/SEGMENT`
    }

    async sendEvent(body: Record<string, any>): Promise<ModifiedResponse> {
        const headers = {
            'x-api-key': this.apiKey,
            'x-platform-id': this.platform,
            'Content-Type': 'application/json'
        }

        return await this.request(this.url, {
            method: 'POST',
            headers,
            json: body
        })
    }
}