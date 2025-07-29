import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import DDApi from '../dd-api'
import { CpaasMessageBody } from '../types'
import type { Settings } from '../../generated-types'

class DDCpaasApi extends DDApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client)
  }

  async sendTransactionalSms(body: CpaasMessageBody): Promise<unknown> {
    const response: ModifiedResponse = await this.post(`/cpaas/messages`, body)

    return response.data
  }
}

export default DDCpaasApi
