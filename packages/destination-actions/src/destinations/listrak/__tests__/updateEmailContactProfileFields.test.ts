import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)
const requestUrl = 'https://api.listrak.com/email/v1/List/123/Contact/SegmentationField'
describe('Listrak', () => {
  it('Update Email Contact Profile Fields Single with Default Mappings', async () => {
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
          '456': 'on'
        }
      }
    })
    expect(responses[0].status).toBe(201)
    expect(responses[0].options.body).toMatchInlineSnapshot(
      '"[{\\"emailAddress\\":\\"test.email@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"on\\"}]}]"'
    )
  })

  it('Update Email Contact Profile Fields Batch with Default Mappings', async () => {
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
    const responses = await testDestination.testBatchAction('updateEmailContactProfileFields', {
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
    expect(responses[0].status).toBe(201)
    expect(responses[0].options.body).toMatchInlineSnapshot(
      '"[{\\"emailAddress\\":\\"test.email1@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"on\\"}]},{\\"emailAddress\\":\\"test.email2@test.com\\",\\"segmentationFieldValues\\":[{\\"segmentationFieldId\\":456,\\"value\\":\\"on\\"}]}]"'
    )
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
