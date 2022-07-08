import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import Definition from '../index'
import { API_VERSION } from '../pa-operations'

const testDestination = createTestIntegration(Definition)

const settings = {
  businessUnitID: 'xyz321',
  accountID: 'abc123',
  isSandbox: false
}
const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123'
}

const baseUrl = 'https://pi.pardot.com'

describe('Pardot', () => {
  describe('Prospects', () => {
    it('should create prospects record', async () => {
      nock(`${baseUrl}/api/${API_VERSION}/prospects/do`).post('/upsertLatestByEmail').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create or update Prospect',
        properties: {
          email: 'test@segment.com',
          first_name: 'Kevin'
        }
      })

      const responses = await testDestination.testAction('prospects', {
        event,
        settings,
        auth,
        mapping: {
          email: {
            '@path': '$.properties.email'
          },
          firstName: {
            '@path': '$.properties.first_name'
          },
          secondaryDeletedSearch: true
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer abc123",
            ],
            "content-type": Array [
              "application/json",
            ],
            "pardot-business-unit-id": Array [
              "xyz321",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"matchEmail\\":\\"test@segment.com\\",\\"prospect\\":{\\"email\\":\\"test@segment.com\\"},\\"secondaryDeletedSearch\\":true}"`
      )
    })
  })
})
