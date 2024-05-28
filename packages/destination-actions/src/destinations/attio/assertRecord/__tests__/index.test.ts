import nock from 'nock'

import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { objectLookup } from '..'
import createRequestClient from '../../../../../../core/src/create-request-client'

const testDestination = createTestIntegration(Destination)
const requestClient = createRequestClient()

const event = createTestEvent({
  type: 'track' as const,
  traits: {
    name: 'Stair car',
    number_of_wheels: 4
  },
  receivedAt: '2024-05-24T10:00:00.000Z'
})

const mapping = {
  object: 'vehicles',
  matching_attribute: 'name',
  attributes: {
    name: {
      '@path': '$.traits.name'
    },
    number_of_wheels: {
      '@path': '$.traits.number_of_wheels'
    }
  },
  received_at: {
    '@path': '$.receivedAt'
  }
}

describe('Attio.assertRecord', () => {
  it('asserts a Record', async () => {
    nock('https://api.attio.com')
      .put('/v2/objects/vehicles/records/simple?matching_attribute=name&append_to_existing_values=true', {
        data: {
          values: {
            name: 'Stair car',
            number_of_wheels: 4
          }
        }
      })
      .reply(200, {})

    const [response] = await testDestination.testAction('assertRecord', {
      event,
      mapping
    })

    expect(response.status).toBe(200)
  })

  describe(objectLookup, () => {
    it('returns a list of objects when API works', async () => {
      nock('https://api.attio.com')
        .get('/v2/objects')
        .reply(200, {
          data: [
            {
              api_slug: 'people',
              singular_noun: 'Person'
            },
            {
              api_slug: 'users',
              singular_noun: 'User'
            },
            {
              api_slug: 'vehicles',
              singular_noun: 'Vehicle'
            }
          ]
        })

      const response = await objectLookup(requestClient)

      expect(response).toEqual({
        choices: [
          {
            label: 'Person',
            value: 'people'
          },
          {
            label: 'User',
            value: 'users'
          },
          {
            label: 'Vehicle',
            value: 'vehicles'
          }
        ]
      })
    })

    it('includes error message when API issues', async () => {
      nock('https://api.attio.com').get('/v2/objects').reply(400, {
        code: 'api_error',
        message: 'Something went wrong',
        status_code: 400
      })

      const response = await objectLookup(requestClient)

      expect(response).toEqual({
        choices: [],
        error: {
          code: '400',
          message: 'Something went wrong'
        }
      })
    })
  })

  it('uses the batch assertion endpoint', async () => {
    nock('https://api.attio.com')
      .put('/v2/batch/records', {
        assertions: [
          {
            object: 'vehicles',
            mode: 'create-or-update',
            matching_attribute: 'name',
            multiselect_values: 'append',
            values: {
              name: 'Stair car',
              number_of_wheels: 4
            },
            received_at: '2024-05-24T10:00:00.000Z'
          }
        ]
      })
      .reply(202, '')

    const [response] = await testDestination.testBatchAction('assertRecord', {
      events: [event],
      mapping,
      settings: {}
    })

    expect(response.status).toBe(202)
  })

  it('handles the case where receivedAt is not provided', async () => {
    const lackingReceivedAtEvent = createTestEvent({
      type: 'track' as const,
      traits: {
        name: 'Stair car',
        number_of_wheels: 4
      },
      receivedAt: undefined
    })

    // Can't control the exact timestamp, so only check it starts on the same year-month-day and is ISO8601 formatted
    const datePrefix = new Date().toISOString().split('T')[0]

    nock('https://api.attio.com')
      .put('/v2/batch/records', new RegExp(`"received_at":"${datePrefix}T`))
      .reply(202, '')

    const [response] = await testDestination.testBatchAction('assertRecord', {
      events: [lackingReceivedAtEvent],
      mapping,
      settings: {}
    })

    expect(response.status).toBe(202)
  })
})
