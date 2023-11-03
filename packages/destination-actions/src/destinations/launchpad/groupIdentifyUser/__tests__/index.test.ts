import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { SegmentEvent } from '@segment/actions-core'

const launchpadAPISecret = 'lp-api-key'
const timestamp = '2023-01-28T15:21:15.449Z'

const testDestination = createTestIntegration(Destination)

const expectedTraits = {
  group_name: 'Launchpad',
  group_industry: 'Technology',
  group_employees: 3,
  group_plan: '1',
  'group_ARR(m)': 1503
}

const testGroupIdentify: SegmentEvent = {
  messageId: 'test-message-t73406chv4',
  timestamp: timestamp,
  type: 'group',
  groupId: '12381923812',
  userId: 'stephen@launchpad.pm',
  traits: {
    name: 'Launchpad',
    industry: 'Technology',
    employees: 3,
    plan: '1',
    'ARR(m)': 1503
  }
}

describe('Launchpad.groupIdentifyUser', () => {
  it('should convert the type and event name', async () => {
    nock('https://data.launchpad.pm').post('/capture').reply(200, {})

    const responses = await testDestination.testAction('groupIdentifyUser', {
      event: testGroupIdentify,
      useDefaultMappings: true,
      settings: {
        apiSecret: launchpadAPISecret,
        sourceName: 'example segment source name'
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      event: '$identify',
      type: 'screen',
      $set: expect.objectContaining(expectedTraits)
    })
  })
})
