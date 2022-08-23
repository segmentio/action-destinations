import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import Definition from '../index'
import { PARDOT_API_VERSION } from '../pa-operations'

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
const sandboxUrl = 'https://pi.demo.pardot.com'

describe('Pardot', () => {
  describe('Prospects', () => {
    it('should create prospects record', async () => {
      nock(`${sandboxUrl}/api/${PARDOT_API_VERSION}/objects/prospects/do`).post('/upsertLatestByEmail').reply(201, {})

      const event = createTestEvent({
        type: 'identify',
        event: 'Create or update Prospect',
        properties: {
          email: 'test@segment.com',
          first_name: 'Kevin'
        }
      })

      const responses = await testDestination.testAction('prospects', {
        event,
        settings: {
          ...settings,
          isSandbox: true
        },
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
        `"{\\"matchEmail\\":\\"test@segment.com\\",\\"prospect\\":{\\"email\\":\\"test@segment.com\\",\\"firstName\\":\\"Kevin\\"},\\"secondaryDeletedSearch\\":true}"`
      )
    })

    it('should create prospects record with default mappings', async () => {
      nock(`${baseUrl}/api/${PARDOT_API_VERSION}/objects/prospects/do`).post('/upsertLatestByEmail').reply(201, {})

      const event = createTestEvent({
        type: 'identify',
        event: 'Create or update Prospect',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          phone: '8888888888',
          title: 'Dream Builder',
          website: 'test.segment.com',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            country: 'The Ocean',
            street: 'Pineapple Ln',
            state: 'Water'
          },
          last_name: 'Bob',
          first_name: 'Sponge',
          secondaryDeletedSearch: true
        }
      })

      const responses = await testDestination.testAction('prospects', {
        event,
        settings,
        auth,
        mapping: {
          secondaryDeletedSearch: true
        },
        useDefaultMappings: true
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
        `"{\\"matchEmail\\":\\"sponge@seamail.com\\",\\"prospect\\":{\\"email\\":\\"sponge@seamail.com\\",\\"firstName\\":\\"Sponge\\",\\"lastName\\":\\"Bob\\",\\"phone\\":\\"8888888888\\",\\"company\\":\\"Krusty Krab\\",\\"jobTitle\\":\\"Dream Builder\\",\\"city\\":\\"Bikini Bottom\\",\\"state\\":\\"Water\\",\\"zip\\":\\"12345\\",\\"country\\":\\"The Ocean\\",\\"website\\":\\"test.segment.com\\"},\\"secondaryDeletedSearch\\":true}"`
      )
    })

    it('should create prospects record with custom fields', async () => {
      nock(`${baseUrl}/api/${PARDOT_API_VERSION}/objects/prospects/do`).post('/upsertLatestByEmail').reply(201, {})

      const event = createTestEvent({
        type: 'identify',
        event: 'Create or update Prospect',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          phone: '8888888888',
          title: 'Dream Builder',
          website: 'test.segment.com',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            country: 'The Ocean',
            street: 'Pineapple Ln',
            state: 'Water'
          },
          last_name: 'Bob',
          first_name: 'Sponge',
          secondaryDeletedSearch: true
        }
      })

      const responses = await testDestination.testAction('prospects', {
        event,
        settings,
        auth,
        mapping: {
          secondaryDeletedSearch: true,
          customFields: {
            A: '1',
            B: '2',
            C: '3'
          }
        },
        useDefaultMappings: true
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
        `"{\\"matchEmail\\":\\"sponge@seamail.com\\",\\"prospect\\":{\\"email\\":\\"sponge@seamail.com\\",\\"firstName\\":\\"Sponge\\",\\"lastName\\":\\"Bob\\",\\"phone\\":\\"8888888888\\",\\"company\\":\\"Krusty Krab\\",\\"jobTitle\\":\\"Dream Builder\\",\\"city\\":\\"Bikini Bottom\\",\\"state\\":\\"Water\\",\\"zip\\":\\"12345\\",\\"country\\":\\"The Ocean\\",\\"website\\":\\"test.segment.com\\",\\"A\\":\\"1\\",\\"B\\":\\"2\\",\\"C\\":\\"3\\"},\\"secondaryDeletedSearch\\":true}"`
      )
    })

    it('[duplicate field] should prioritize with custom fields', async () => {
      nock(`${baseUrl}/api/${PARDOT_API_VERSION}/objects/prospects/do`).post('/upsertLatestByEmail').reply(201, {})

      const event = createTestEvent({
        type: 'identify',
        event: 'Create or update Prospect',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          phone: '8888888888',
          title: 'Dream Builder',
          website: 'test.segment.com',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            country: 'The Ocean',
            street: 'Pineapple Ln',
            state: 'Water'
          },
          last_name: 'Bob',
          first_name: 'Sponge',
          secondaryDeletedSearch: true
        }
      })

      const responses = await testDestination.testAction('prospects', {
        event,
        settings,
        auth,
        mapping: {
          secondaryDeletedSearch: true,
          customFields: {
            email: 'kevin@segment.com'
          }
        },
        useDefaultMappings: true
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
        `"{\\"matchEmail\\":\\"sponge@seamail.com\\",\\"prospect\\":{\\"email\\":\\"kevin@segment.com\\",\\"firstName\\":\\"Sponge\\",\\"lastName\\":\\"Bob\\",\\"phone\\":\\"8888888888\\",\\"company\\":\\"Krusty Krab\\",\\"jobTitle\\":\\"Dream Builder\\",\\"city\\":\\"Bikini Bottom\\",\\"state\\":\\"Water\\",\\"zip\\":\\"12345\\",\\"country\\":\\"The Ocean\\",\\"website\\":\\"test.segment.com\\"},\\"secondaryDeletedSearch\\":true}"`
      )
    })
    it('should throw an error for missing required field: email', async () => {
      nock(`${baseUrl}/api/${PARDOT_API_VERSION}/objects/prospects/do`).post('/upsertLatestByEmail').reply(201, {})

      const event = createTestEvent({
        type: 'identify',
        event: 'Create or update Prospect',
        properties: {
          first_name: 'Kevin'
        }
      })

      await expect(
        testDestination.testAction('prospects', {
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
      ).rejects.toThrowError("The root value is missing the required field 'email'.")
    })
  })
})
