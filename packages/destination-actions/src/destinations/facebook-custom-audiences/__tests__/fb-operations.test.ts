import createRequestClient from '../../../../../core/src/request-client'
import FacebookClient, { BASE_URL } from '../fbca-operations'
import { Settings } from '../generated-types'
import nock from 'nock'

const requestClient = createRequestClient()
const settings: Settings = {
  retlAdAccountId: 'act_123456'
}

describe('Facebook Custom Audiences', () => {
  describe('retlOnMappingSave hook', () => {
    const facebookClient = new FacebookClient(requestClient, settings.retlAdAccountId)
    const hookInputs = {
      audienceName: 'test-audience'
    }

    it('should create a custom audience in facebook', async () => {
      nock(`${BASE_URL}`)
        .post(`/${settings.retlAdAccountId}/customaudiences`, {
          name: hookInputs.audienceName,
          subtype: 'CUSTOM',
          customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
        })
        .reply(201, { id: '123' })

      await facebookClient.createAudience(hookInputs.audienceName)
    })
  })
})
