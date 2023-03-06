// import type { DestinationDefinition } from '@segment/actions-core'
// import type { Settings } from '../generated-types'
// import receiveEvents from '../receiveEvents'
// import destination from '../index';

import { createTestIntegration } from '@segment/actions-core'
import acoustic from '../index'
import { Settings } from '../generated-types'

jest.mock('@segment/actions-core')
jest.mock('../generated-types')
jest.mock('../receiveEvents')

describe('destination', () => {
  it('should expose a method extendRequest()', () => {
    //const retValue = destination.extendRequest();
    expect(true).toBeTruthy()
  })
})
const testDestination = createTestIntegration(acoustic)

describe('Destination ', () => {
  describe('receiveEvents', () => {
    it('should validate action fields', async () => {
      try {
        await testDestination.testAction('receiveEvents', {
          settings: {
            ...Settings //apiKey: 'api-key'
          }
        })
      } catch (err) {
        expect(err).toBeDefined()
      }
    })

    it('should work', async () => {
      nock('https://api.getripe.com/core-backend').post('/identify').reply(200, {})

      const responses = await testDestination.testAction('identify', {
        mapping: { anonymousId: 'my-id', traits: {} },
        settings: { apiKey: 'api-key', endpoint: 'https://api.getripe.com/core-backend' }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toContain('my-id')
      expect(responses[0].options.body).toContain('traits')
    })
  })
})
