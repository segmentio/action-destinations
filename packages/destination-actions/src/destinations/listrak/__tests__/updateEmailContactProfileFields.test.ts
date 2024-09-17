import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)
const requestUrl = 'https://api.listrak.com/email/v1/List/123/Contact/SegmentationField'
describe('Listrak', () => {
  const testCasesProfileIdValues: any[] = [
    {
      name: 'On',
      profileIdValue: 'on'
    },
    {
      name: 'Off',
      profileIdValue: 'off'
    },
    {
      name: 'Using Audience Key',
      profileIdValue: 'useAudienceKey'
    },
    {
      name: 'Random String',
      profileIdValue: 'random'
    }
  ]

  testCasesProfileIdValues.forEach((testData: any) => {
    it(`Update Email Contact Profile Fields Single with Default Mappings and Field ID Value "${testData.name}"`, async () => {
      nock(requestUrl).post('').reply(201, {})
      const settings = {
        client_id: 'clientId1',
        client_secret: 'clientSecret1'
      }
      const event = createTestEvent({
        context: {
          traits: {
            email: 'test.email@test.com'
          },
          personas: {
            computation_key: 'listrak_audience'
          }
        },
        properties: {
          audience_key: 'listrak_audience',
          listrak_audience: true
        }
      })
      const responses = await testDestination.testAction('updateEmailContactProfileFields', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          listId: 123,
          profileFieldValues: {
            '456': testData.profileIdValue
          }
        }
      })
      expect(responses[0].status).toBe(201)
      if (testData.profileIdValue === 'useAudienceKey') {
        // If the profileIdValue is "useAudienceKey", the profileIdValue should be the value of the audience_key which is true
        expect(responses[0].options.body).toMatchInlineSnapshot(
          '"[{\\"emailAddress\\":\\"test.email@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"on\\"}]}]"'
        )
      } else {
        expect(responses[0].options.body).toMatchInlineSnapshot(
          `"[{\\"emailAddress\\":\\"test.email@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"${testData.profileIdValue}\\"}]}]"`
        )
      }
    })
  })

  testCasesProfileIdValues.forEach((testData: any) => {
    it(`Update Email Contact Profile Fields Batch with Default Mappingsand Field ID Value "${testData.name}"`, async () => {
      nock(requestUrl).post('').reply(201, {})
      const settings = {
        client_id: 'clientId1',
        client_secret: 'clientSecret1'
      }
      const events = [
        createTestEvent({
          context: {
            traits: {
              email: 'test.email1@test.com'
            },
            personas: {
              computation_key: 'listrak_audience'
            }
          },
          properties: {
            audience_key: 'listrak_audience',
            listrak_audience: true
          }
        }),
        createTestEvent({
          context: {
            traits: {
              email: 'test.email2@test.com'
            },
            personas: {
              computation_key: 'listrak_audience'
            }
          },
          properties: {
            audience_key: 'listrak_audience',
            listrak_audience: false
          }
        })
      ]
      const responses = await testDestination.testBatchAction('updateEmailContactProfileFields', {
        events,
        settings,
        useDefaultMappings: true,
        mapping: {
          listId: 123,
          profileFieldValues: {
            '456': testData.profileIdValue
          }
        }
      })
      expect(responses[0].status).toBe(201)
      if (testData.profileIdValue === 'useAudienceKey') {
        expect(responses[0].options.body).toMatchInlineSnapshot(
          '"[{\\"emailAddress\\":\\"test.email1@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"on\\"}]},{\\"emailAddress\\":\\"test.email2@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"off\\"}]}]"'
        )
      } else {
        expect(responses[0].options.body).toMatchInlineSnapshot(
          `"[{\\"emailAddress\\":\\"test.email1@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"${testData.profileIdValue}\\"}]},{\\"emailAddress\\":\\"test.email2@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"${testData.profileIdValue}\\"}]}]"`
        )
      }
    })
  })

  const testCasesInvalidProfileIds: any[] = [
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
  testCasesInvalidProfileIds.forEach((testData: any) => {
    it(`Update Email Contact Profile Fields Field is Filtered When Segmentation Field ID is ${testData.name}`, async () => {
      nock(requestUrl).post('').reply(201, {})
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
      const responses = await testDestination.testAction('updateEmailContactProfileFields', {
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
      expect(responses[0].status).toBe(201)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        '"[{\\"emailAddress\\":\\"test.email@test.com\\",\\"segmentationFieldValues\\":[]}]"'
      )
    })
  })

  it('Update Email Contact Profile Fields Payload has Multiple Lists Request Submitted for Each List', async () => {
    nock(requestUrl).post('').reply(201, {})
    nock(requestUrl.replace('123', '456')).post('').reply(201, {})
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
      }),
      createTestEvent({
        context: {
          traits: {
            email: 'test.email3@test.com',
            listId: 123
          }
        }
      })
    ]
    const responses = await testDestination.testBatchAction('updateEmailContactProfileFields', {
      events,
      settings,
      useDefaultMappings: true,
      mapping: {
        listId: {
          '@path': '$.context.traits.listId'
        },
        profileFieldValues: {
          '456': 'on'
        }
      }
    })
    expect(responses[0].status).toBe(201)
    expect(responses[0].options.body).toMatchInlineSnapshot(
      '"[{\\"emailAddress\\":\\"test.email1@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"on\\"}]},{\\"emailAddress\\":\\"test.email3@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"on\\"}]}]"'
    )
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.body).toMatchInlineSnapshot(
      '"[{\\"emailAddress\\":\\"test.email2@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"on\\"}]}]"'
    )
  })
})
