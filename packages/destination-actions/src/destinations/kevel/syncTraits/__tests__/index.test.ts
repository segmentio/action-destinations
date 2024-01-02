import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const goodIdentifyEvent = createTestEvent({
  type: 'identify',
  userId: 'uid1',

  traits: {
    first_name: 'Billy',
    last_name: 'Bob'
  }
})

describe('Kevel.syncTraits', () => {
  it('should fetch and merge traits, and then not throw an error - track', async () => {
    const userId = 'uid1'
    const networkId1 = 'networkId1'
    const baseUrl = `https://e-${networkId1}.adzerk.net/udb/${networkId1}`

    const allTraits = {
      first_name: 'Billy',
      last_name: 'Bob',
      age: 2
    }

    nock(baseUrl)
      .get(`/read?userKey=${userId}`)
      .reply(200, {
        custom: {
          age: 24
        }
      })

    nock(baseUrl).post(`/customProperties?userKey=${userId}`, allTraits).reply(200)

    await expect(
      testDestination.testAction('syncTraits', {
        event: goodIdentifyEvent,
        settings: {
          networkId: networkId1,
          apiKey: 'apiKey1'
        },
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })
})
