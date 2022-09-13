import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.mergeContacts', () => {
  afterEach(() => {
    if (!nock.isDone()) {
      throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
    }
    nock.cleanAll()
  })
  it('should work with default mappings', async () => {
    nock(/api.cordial.io/).post('/api/segment/mergeContacts').once().reply(202, {success: 'success'})

    const event = createTestEvent({
      "anonymousId": "507f191e810c19729de860ea",
      "previousId": "39239-239239-239239-23923",
      "type": "alias",
      "userId": "507f191e81",
    })

    const mapping = {}

    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://api.cordial.io' as const,
      segmentIdKey: 'segment_id'
    }

    const responses = await testDestination.testAction('mergeContacts', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(202);
    expect(responses[0].data).toMatchObject({success: 'success'});
    expect(responses[0].options.json).toMatchObject({
      segmentIdKey: 'segment_id',
      previousId: '39239-239239-239239-23923',
      anonymousId: '507f191e810c19729de860ea',
      segmentId: '507f191e81',
    })
  })
})
