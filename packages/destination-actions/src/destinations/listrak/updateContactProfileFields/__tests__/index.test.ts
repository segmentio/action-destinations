import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const verifyNocks = () => {
  if (!nock.isDone()) {
    throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
  }
  nock.cleanAll()
}

describe('Listrak.updateContactProfileFields', () => {
  it('No Auth Token updates contact profile fields', async () => {
    nock('https://auth.listrak.com')
      .post('/OAuth2/Token', 'client_id=clientId1&client_secret=clientSecret1&grant_type=client_credentials')
      .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
      .reply(200, {
        access_token: 'token',
        token_type: 'Bearer',
        expires_in: 900
      })

    nock('https://api.listrak.com/email/v1')
      .post('/List/123/Contact/SegmentationField', [
        {
          emailAddress: 'test.email@test.com',
          segmentationFieldValues: [
            {
              segmentationFieldId: 456,
              value: 'on'
            }
          ]
        }
      ])
      .matchHeader('content-type', 'application/json')
      .matchHeader('Authorization', `Bearer token`)
      .reply(201, {
        status: 201,
        resourceId: ''
      })

    const settings = {
      client_id: 'clientId1',
      client_secret: 'clientSecret1'
    }

    const event = createTestEvent({
      context: {
        traits: {
          email: 'test.email@test.com'
        }
      }
    })

    await expect(
      testDestination.testAction('updateContactProfileFields', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          listId: 123,
          segmentationFieldValues: [
            {
              segmentationFieldId: 456,
              value: 'on'
            }
          ]
        }
      })
    ).resolves.not.toThrowError()

    verifyNocks()
  })
})
