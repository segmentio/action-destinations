import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import DDApi from '../dd-api'
import { CpaasMessageBody } from '../types'

class DDCpaasApi extends DDApi {
  constructor(api_host: string, client: RequestClient) {
    super(api_host, client)
  }

  async sendTransactionalSms(body: CpaasMessageBody): Promise<unknown> {
    const response: ModifiedResponse = await this.post(`/cpaas/messages`, body)

    return response.data
  }
}

export default DDCpaasApi
