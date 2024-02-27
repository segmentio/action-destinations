import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../utils/constants'

const testDestination = createTestIntegration(Destination)

const CALLIPER_SEGMENT_KEY = 'test-key'
const CALLIPER_COMPANY_ID = 'test-company'

describe('Calliper.alias', () => {
  it('should call the event storage API', async () => {
    const event = createTestEvent({ previousId: 'user9999' })

    nock(API_URL).post('/user/alias').reply(200, {})

    const responses = await testDestination.testAction('alias', {
      event,
      useDefaultMappings: true,
      settings: {
        segmentKey: CALLIPER_SEGMENT_KEY,
        companyId: CALLIPER_COMPANY_ID
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      companyId: CALLIPER_COMPANY_ID,
      key: CALLIPER_SEGMENT_KEY,
      alias: {
        new_id: 'user1234',
        previous_id: 'user9999'
      }
    })
  })
})
