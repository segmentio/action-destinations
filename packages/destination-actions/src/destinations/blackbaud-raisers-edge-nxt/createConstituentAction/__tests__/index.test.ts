import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../../index'
import { SKY_API_CONSTITUENT_URL } from '../../constants'
import { trackEventData, trackEventDataNewConstituent, trackEventDataNoConstituent } from '../fixtures'

const testDestination = createTestIntegration(Destination)

const mapping = {
  constituent_email: {
    address: {
      '@path': '$.properties.email'
    },
    type: {
      '@path': '$.properties.emailType'
    }
  },
  constituent_id: {
    '@path': '$.properties.constituentId'
  },
  date: {
    '@path': '$.timestamp'
  },
  category: {
    '@path': '$.properties.category'
  }
}

describe('BlackbaudRaisersEdgeNxt.createConstituentAction', () => {
  test('should create a new constituent action successfully', async () => {
    const event = createTestEvent(trackEventData)

    nock(SKY_API_CONSTITUENT_URL).post('/actions').reply(200, {
      id: '1000'
    })

    await expect(
      testDestination.testAction('createConstituentAction', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should create a new constituent and associate action with it', async () => {
    const event = createTestEvent(trackEventDataNewConstituent)

    nock(SKY_API_CONSTITUENT_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 0,
        value: []
      })

    nock(SKY_API_CONSTITUENT_URL).post('/constituents').reply(200, {
      id: '456'
    })

    nock(SKY_API_CONSTITUENT_URL).post('/actions').reply(200, {
      id: '1001'
    })

    await expect(
      testDestination.testAction('createConstituentAction', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should throw an IntegrationError if no constituent provided', async () => {
    const event = createTestEvent(trackEventDataNoConstituent)

    await expect(
      testDestination.testAction('createConstituentAction', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new IntegrationError('Missing constituent_id value', 'MISSING_REQUIRED_FIELD', 400))
  })
})
