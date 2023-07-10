import nock from 'nock'
import { createTestEvent, createTestIntegration, DynamicFieldResponse } from '@segment/actions-core'
import Destination from '../../index'
import { clearToken, setToken } from '../../listrak'

const testDestination = createTestIntegration(Destination)

const verifyNocks = () => {
  if (!nock.isDone()) {
    throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
  }
}

describe('updateContactProfileFields', () => {
  beforeEach(() => {
    clearToken()
    nock.cleanAll()
  })

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
      .matchHeader('authorization', `Bearer token`)
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
          profileFieldValues: {
            '456': 'on'
          }
        }
      })
    ).resolves.not.toThrowError()

    verifyNocks()
  })

  const testCases: any[] = [
    {
      name: 'undefined',
      userInputProfileFieldId: undefined
    },
    {
      name: 'null',
      userInputProfileFieldId: null
    },
    {
      name: 'non int string',
      userInputProfileFieldId: 'test'
    },
    {
      name: '0 string',
      userInputProfileFieldId: '0'
    },
    {
      name: 'empty string',
      userInputProfileFieldId: ''
    }
  ]
  testCases.forEach((testData: any) => {
    it(`${testData.name} for Segmentation Field ID, data gets filtered before API call`, async () => {
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
            segmentationFieldValues: []
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
            profileFieldValues: {
              [testData.userInputProfileFieldId]: 'on'
            }
          }
        })
      ).resolves.not.toThrowError()

      verifyNocks()
    })
  })

  it('List ID dynamic field retrieves lists', async () => {
    nock('https://auth.listrak.com')
      .post('/OAuth2/Token', 'client_id=clientId1&client_secret=clientSecret1&grant_type=client_credentials')
      .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
      .reply(200, {
        access_token: 'token',
        token_type: 'Bearer',
        expires_in: 900
      })

    nock('https://api.listrak.com/email/v1')
      .get('/List')
      .matchHeader('authorization', `Bearer token`)
      .reply(201, {
        data: [
          {
            listId: 123,
            listName: 'List Name C'
          },
          {
            listId: 456,
            listName: 'List Name b'
          },
          {
            listId: 789,
            listName: 'List Name a'
          }
        ]
      })

    const settings = {
      client_id: 'clientId1',
      client_secret: 'clientSecret1'
    }

    const response = (await testDestination.testDynamicField('updateContactProfileFields', 'listId', {
      settings,
      payload: {}
    })) as DynamicFieldResponse

    expect(response.choices).toStrictEqual([
      {
        value: '789',
        label: 'List Name a'
      },
      {
        value: '456',
        label: 'List Name b'
      },
      {
        value: '123',
        label: 'List Name C'
      }
    ])

    expect(response.nextPage).toBeUndefined()

    expect(response.error).toBeUndefined()

    verifyNocks()
  })

  it('Auth token does exist, does not retrieve one', async () => {
    setToken('token')
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
      .matchHeader('authorization', `Bearer token`)
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
          profileFieldValues: {
            '456': 'on'
          }
        }
      })
    ).resolves.not.toThrowError()

    verifyNocks()
  })

  it('Auth token expired, retrievs new one', async () => {
    setToken('token')
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
      .matchHeader('authorization', `Bearer token`)
      .reply(401, {
        status: 401,
        error: 'ERROR_UNAUTHORIZED',
        message: 'Authorization was denied for this request.'
      })

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
      .matchHeader('authorization', `Bearer token`)
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
          profileFieldValues: {
            '456': 'on'
          }
        }
      })
    ).resolves.not.toThrowError()

    verifyNocks()
  })
})
