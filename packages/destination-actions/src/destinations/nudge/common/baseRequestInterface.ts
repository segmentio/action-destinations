import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import type { Payload as TrackPayload } from '../trackEvent/generated-types'
import type { Payload as IdentifyPayload } from '../identifyUser/generated-types'

export default class BaseRequestInterface {
  private static baseURL = 'https://main-api.nudgenow.com/api/integration/segment'
  private static platform = '17'

  public static async track(request: RequestClient, settings: Settings, payload: TrackPayload) {
    return await request(this.baseURL + '/events/batch', {
      method: 'POST',
      json: [payload],
      headers: {
        apikey: settings.apikey,
        p: this.platform
      }
    })
  }

  public static async batchTrack(request: RequestClient, settings: Settings, payload: TrackPayload[]) {
    return await request(this.baseURL + '/events/batch', {
      method: 'POST',
      json: payload,
      headers: {
        apikey: settings.apikey,
        p: this.platform
      }
    })
  }

  public static async identify(request: RequestClient, settings: Settings, payload: IdentifyPayload) {
    return await request(this.baseURL + '/identify', {
      method: 'PUT',
      json: payload,
      headers: {
        apikey: settings.apikey,
        p: this.platform
      }
    })
  }
}
