import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { FLAG_AUDIENCE_MEMBERSHIP } from '../../utils'

const testDestination = createTestIntegration(Destination)

const settings = {
  region: 'https://advertising-api.amazon.com'
}

const personas = {
  audience_settings: {
    advertiserId: '585806696618602999',
    countryCode: 'US',
    description: 'Test Event',
    externalAudienceId: '65241452'
  },
  computation_class: 'journey_step',
  computation_id: 'aud_2g5VilffxpBYqelWk4K0yBzAuFl',
  computation_key: 'journey_step_key',
  external_audience_id: '379909525712777677',
  namespace: 'spa_rHVbZsJXToWAwcmbgpfo36',
  space_id: 'spa_rHVbZsJXToWAwcmbgpfo36'
}

const recordActions = (request: { options: { body?: unknown } }) =>
  JSON.parse(request.options.body as string).records.map((r: { action: string }) => r.action)

describe('AmazonAds.syncAudiencesToDSP journeys', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  afterEach(() => {
    expect(nock.isDone()).toBe(true)
    nock.cleanAll()
  })

  const mockRecordsEndpoint = () =>
    nock('https://advertising-api.amazon.com')
      .post('/amc/audiences/records')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

  const buildV2Event = (membership: boolean, userId = 'test-user-01') =>
    createTestEvent({
      type: 'track',
      event: 'Some Other Event',
      userId,
      context: { personas, traits: { email: 'test@twilio.com' } },
      properties: { journey_step_key: membership }
    })

  it('Journeys V2: properties[computation_key] true resolves to CREATE when event is not Audience Entered/Exited', async () => {
    mockRecordsEndpoint()
    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event: buildV2Event(true),
      settings,
      useDefaultMappings: true,
      features: { [FLAG_AUDIENCE_MEMBERSHIP]: true }
    })
    expect(recordActions(response[0])).toEqual(['CREATE'])
  })

  it('Journeys V2: properties[computation_key] false resolves to DELETE when event is not Audience Entered/Exited', async () => {
    mockRecordsEndpoint()
    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event: buildV2Event(false),
      settings,
      useDefaultMappings: true,
      features: { [FLAG_AUDIENCE_MEMBERSHIP]: true }
    })
    expect(recordActions(response[0])).toEqual(['DELETE'])
  })

  it('Journeys V2 batch: each record resolves from its own properties[computation_key]', async () => {
    mockRecordsEndpoint()
    const response = await testDestination.testBatchAction('syncAudiencesToDSP', {
      events: [buildV2Event(true, 'user-1'), buildV2Event(false, 'user-2'), buildV2Event(true, 'user-3')],
      settings,
      useDefaultMappings: true,
      features: { [FLAG_AUDIENCE_MEMBERSHIP]: true }
    })
    expect(recordActions(response[0])).toEqual(['CREATE', 'DELETE', 'CREATE'])
  })

  it('Flag off: Journeys V2 events that are not Audience Entered/Exited still resolve to DELETE', async () => {
    mockRecordsEndpoint()
    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event: buildV2Event(true),
      settings,
      useDefaultMappings: true
    })
    expect(recordActions(response[0])).toEqual(['DELETE'])
  })

  it('Flag off batch: Journeys V2 events that are not Audience Entered/Exited still resolve to DELETE', async () => {
    mockRecordsEndpoint()
    const response = await testDestination.testBatchAction('syncAudiencesToDSP', {
      events: [buildV2Event(true, 'user-1'), buildV2Event(false, 'user-2')],
      settings,
      useDefaultMappings: true
    })
    expect(recordActions(response[0])).toEqual(['DELETE', 'DELETE'])
  })

  it('Legacy Journeys: no properties[computation_key] boolean, resolves to CREATE via legacy audienceMembership', async () => {
    mockRecordsEndpoint()
    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event: createTestEvent({
        type: 'track',
        event: 'Some Other Event',
        userId: 'test-user-01',
        context: { personas, traits: { email: 'test@twilio.com' } },
        properties: {}
      }),
      settings,
      useDefaultMappings: true,
      features: { [FLAG_AUDIENCE_MEMBERSHIP]: true, 'actions-legacy-journeys-audience-membership': true }
    })
    expect(recordActions(response[0])).toEqual(['CREATE'])
  })
})
