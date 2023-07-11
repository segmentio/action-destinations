import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { clearToken, setToken } from '../../listrak'
import { ContactSegmentationFieldValues } from '..'

const testDestination = createTestIntegration(Destination)

const verifyNocks = () => {
  if (!nock.isDone()) {
    throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
  }
}

describe('updateEmailContactProfileFields', () => {
  beforeEach(() => {
    clearToken()
    nock.cleanAll()
  })

  it('No Auth Token updates contact profile fields', async () => {
    withGetAccessToken()

    withUpdateProfileFields([
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
      testDestination.testAction('updateEmailContactProfileFields', {
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

  it('Perform batch maps and returns with no errors', async () => {
    withGetAccessToken()

    withUpdateProfileFields([
      {
        emailAddress: 'test.email1@test.com',
        segmentationFieldValues: [
          {
            segmentationFieldId: 456,
            value: 'on'
          }
        ]
      },
      {
        emailAddress: 'test.email2@test.com',
        segmentationFieldValues: [
          {
            segmentationFieldId: 456,
            value: 'on'
          }
        ]
      }
    ])

    const settings = {
      client_id: 'clientId1',
      client_secret: 'clientSecret1'
    }

    const events = [
      createTestEvent({
        context: {
          traits: {
            email: 'test.email1@test.com'
          }
        }
      }),
      createTestEvent({
        context: {
          traits: {
            email: 'test.email2@test.com'
          }
        }
      })
    ]

    await expect(
      testDestination.testBatchAction('updateEmailContactProfileFields', {
        events,
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
      withGetAccessToken()

      withUpdateProfileFields([
        {
          emailAddress: 'test.email@test.com',
          segmentationFieldValues: []
        }
      ])

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
        testDestination.testAction('updateEmailContactProfileFields', {
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

  it('Auth token does exist, does not retrieve one', async () => {
    setToken('token')

    withUpdateProfileFields([
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
      testDestination.testAction('updateEmailContactProfileFields', {
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

  it('Auth token expired, retrieves new one', async () => {
    setToken('token')

    withUnauthorizedUpdateProfileFields()

    withGetAccessToken()

    withUpdateProfileFields([
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
      testDestination.testAction('updateEmailContactProfileFields', {
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

  it('Auth token expired, retrieves new one, second token invalid, throws exception', async () => {
    setToken('token')

    withUnauthorizedUpdateProfileFields()

    withGetAccessToken()

    withUnauthorizedUpdateProfileFields()

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
      testDestination.testAction('updateEmailContactProfileFields', {
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
    ).rejects.toThrowError()

    verifyNocks()
  })

  it('Payload has multiple list IDs, makes request for each list', async () => {
    withGetAccessToken()

    withUpdateProfileFields(
      [
        {
          emailAddress: 'test.email1@test.com',
          segmentationFieldValues: [
            {
              segmentationFieldId: 456,
              value: 'on'
            }
          ]
        },
        {
          emailAddress: 'test.email3@test.com',
          segmentationFieldValues: [
            {
              segmentationFieldId: 456,
              value: 'on'
            }
          ]
        }
      ],
      123
    )

    withUpdateProfileFields(
      [
        {
          emailAddress: 'test.email2@test.com',
          segmentationFieldValues: [
            {
              segmentationFieldId: 456,
              value: 'on'
            }
          ]
        }
      ],
      456
    )

    const settings = {
      client_id: 'clientId1',
      client_secret: 'clientSecret1'
    }

    const events = [
      createTestEvent({
        context: {
          traits: {
            email: 'test.email1@test.com',
            listId: 123
          }
        }
      }),
      createTestEvent({
        context: {
          traits: {
            email: 'test.email2@test.com',
            listId: 456
          }
        }
      })
    ]

    await expect(
      testDestination.testBatchAction('updateEmailContactProfileFields', {
        events,
        settings,
        useDefaultMappings: true,
        mapping: {
          listId: {
            '@path': '$.context.traits.email'
          },
          profileFieldValues: {
            '456': 'on'
          }
        }
      })
    ).resolves.not.toThrowError()

    verifyNocks()
  })
})

function withUpdateProfileFields(contactSegmentationFieldValues: ContactSegmentationFieldValues[], listId = 123) {
  nock('https://api.listrak.com/email/v1')
    .post(`/List/${listId}/Contact/SegmentationField`, contactSegmentationFieldValues)
    .matchHeader('content-type', 'application/json')
    .matchHeader('authorization', `Bearer token`)
    .reply(201, {
      status: 201,
      resourceId: ''
    })
}

function withGetAccessToken() {
  nock('https://auth.listrak.com')
    .post('/OAuth2/Token', 'client_id=clientId1&client_secret=clientSecret1&grant_type=client_credentials')
    .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
    .reply(200, {
      access_token: 'token',
      token_type: 'Bearer',
      expires_in: 900
    })
}

function withUnauthorizedUpdateProfileFields() {
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
}
