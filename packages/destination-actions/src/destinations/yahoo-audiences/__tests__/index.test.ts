import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'

import Destination from '../index'

describe('Yahoo Audiences', () => {
  describe('createAudience', () => {
    let createAudienceInput: any
    let testDestination: any

    beforeEach(() => {
      testDestination = createTestIntegration(Destination)
      createAudienceInput = {
        settings: {
          engage_space_id: '123',
          mdm_id: '234',
          taxonomy_client_key: '345',
          taxonomy_client_secret: '456',
          customer_desc: 'Spacely Sprockets'
        },
        audienceSettings: {
          audience_id: '123',
          audience_key: '234',
          engage_space_id: '345'
        }
      }
    })

    describe('Success cases', () => {
      it('It should create the audience successfully', async () => {
        nock('https://datax.yahooapis.com').put('/v1/taxonomy/append/345').reply(202, {
          anything: '123'
        })

        const result = await testDestination.createAudience(createAudienceInput)
        expect(result.externalId).toBe('123')
      })
    })
  })
})
