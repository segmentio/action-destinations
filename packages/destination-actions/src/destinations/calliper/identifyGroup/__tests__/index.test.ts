import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../utils/constants'

const testDestination = createTestIntegration(Destination)
const date = new Date()
const timestamp = date.toISOString()
const CALLIPER_SEGMENT_KEY = 'test-key'
const CALLIPER_COMPANY_ID = 'test-company'

describe('Calliper.identifyGroup', () => {
  it('should call group identification API', async () => {
    const event = createTestEvent({
      timestamp,
      groupId: 'group-id-12',
      traits: {
        abc: '123'
      }
    })

    nock(API_URL).post('/group/identify').reply(200, {})

    const responses = await testDestination.testAction('identifyGroup', {
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
      group: {
        group_id: 'group-id-12',
        traits: {
          abc: '123'
        }
      }
    })
  })
})
