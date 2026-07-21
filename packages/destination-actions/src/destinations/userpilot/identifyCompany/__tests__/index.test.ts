import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const companyId = 'fake-company-id'
const apiKey = 'fake-api-key'
const baseUrl = 'https://analytex.userpilot.io/'

describe('Userpilot.identifyCompany', () => {
  it('should call identifyCompany successfully', async () => {
    nock(baseUrl).post('/v1/companies/identify').reply(202, {})

    const event = createTestEvent({
      groupId: companyId,
      traits: {
        name: 'Company Name',
        primary_email: 'company@example.com',
        createdAt: '2021-01-01'
      }
    })

    const responses = await testDestination.testAction('identifyCompany', {
      event,
      settings: {
        apiKey: apiKey,
        endpoint: baseUrl
      },
      mapping: {
        groupId: companyId,
        traits: {
          name: 'Company Name',
          primary_email: 'company@example.com',
          createdAt: '2021-01-01'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"company_id\\":\\"fake-company-id\\",\\"metadata\\":{\\"name\\":\\"Company Name\\",\\"primary_email\\":\\"company@example.com\\"}}"`
    )

    expect(nock.isDone()).toBe(true)
  })
})
