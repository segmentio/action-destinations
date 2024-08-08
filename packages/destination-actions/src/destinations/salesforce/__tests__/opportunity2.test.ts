import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../sf-operations'

const testDestination = createTestIntegration(Destination)

const settings = {
  instanceUrl: 'https://test.salesforce.com/'
}
const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123'
}

describe('Salesforce', () => {
  describe('Opportunity', () => {
    it('should create a opportunity record', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Opportunity').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Opportunity',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name',
          stage_name: 'Opportunity stage name'
        }
      })

      const responses = await testDestination.testAction('opportunity2', {
        event,
        settings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'add',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
          }
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
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name\\",\\"StageName\\":\\"Opportunity stage name\\"}"`
      )
    })

    it('should create a opportunity record with custom fields', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Opportunity').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Opportunity w/ custom fields',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name',
          stage_name: 'Opportunity stage name',
          description: 'This is a test opportunity description'
        }
      })

      const responses = await testDestination.testAction('opportunity2', {
        event,
        settings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'add',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
          },
          customFields: {
            A: '1',
            B: '2',
            C: '3'
          }
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
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name\\",\\"StageName\\":\\"Opportunity stage name\\",\\"A\\":\\"1\\",\\"B\\":\\"2\\",\\"C\\":\\"3\\"}"`
      )
    })

    it('should delete an opportunity record given an Id', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).delete('/Opportunity/123').reply(204, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Delete',
        userId: '123'
      })

      const responses = await testDestination.testAction('opportunity2', {
        event,
        settings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'delete',
          traits: {
            Id: { '@path': '$.userId' }
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(204)
    })

    it('should delete an opportunity record given some lookup traits', async () => {
      const query = encodeURIComponent(`SELECT Id FROM Opportunity WHERE Email = 'bob@bobsburgers.net'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          totalSize: 1,
          records: [{ Id: 'abc123' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).delete('/Opportunity/abc123').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Delete',
        properties: {
          email: 'bob@bobsburgers.net'
        }
      })

      const responses = await testDestination.testAction('opportunity2', {
        event,
        settings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'delete',
          traits: {
            Email: { '@path': '$.properties.email' }
          }
        }
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
      expect(responses[1].status).toBe(201)
    })

    it('should update a opportunity record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Update Opportunity',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name updated',
          stage_name: 'Opportunity stage name',
          description: 'This is a test opportunity description'
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Opportunity WHERE name = 'Opportunity Test Name OG'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Opportunity/123456').reply(201, {})

      const responses = await testDestination.testAction('opportunity2', {
        event,
        settings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'update',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
          },
          traits: {
            name: 'Opportunity Test Name OG'
          }
        }
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
      expect(responses[1].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer abc123",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name updated\\",\\"StageName\\":\\"Opportunity stage name\\"}"`
      )
    })

    it('should upsert an existing opportunity record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert existing Opportunity',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name updated',
          stage_name: 'Opportunity stage name',
          description: 'This is a test opportunity description'
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Opportunity WHERE name = 'Opportunity Test Name OG'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Opportunity/123456').reply(201, {})

      const responses = await testDestination.testAction('opportunity2', {
        event,
        settings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'upsert',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
          },
          traits: {
            name: 'Opportunity Test Name OG'
          }
        }
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
      expect(responses[1].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer abc123",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name updated\\",\\"StageName\\":\\"Opportunity stage name\\"}"`
      )
    })

    it('should upsert a nonexistent opportunity record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert non-existent Opportunity',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name updated',
          stage_name: 'Opportunity stage name',
          description: 'This is a test opportunity description'
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Opportunity WHERE name = 'Opportunity Test Name OG'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`).get(`/?q=${query}`).reply(201, {
        Id: 'abc123',
        totalSize: 0
      })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Opportunity').reply(201, {})

      const responses = await testDestination.testAction('opportunity2', {
        event,
        settings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'upsert',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
          },
          traits: {
            name: 'Opportunity Test Name OG'
          }
        }
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
      expect(responses[1].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer abc123",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name updated\\",\\"StageName\\":\\"Opportunity stage name\\"}"`
      )
    })

    describe('batching', () => {
      it('should fail if delete is set as syncMode', async () => {
        const event = createTestEvent({
          type: 'track',
          event: 'Create Opportunity',
          properties: {
            close_date: '2022-02-18T22:26:24.997Z',
            name: 'Opportunity Test Name',
            stage_name: 'Opportunity stage name'
          }
        })

        await expect(async () => {
          await testDestination.testBatchAction('opportunity2', {
            events: [event],
            settings,
            mapping: {
              enable_batching: true,
              __segment_internal_sync_mode: 'delete',
              close_date: {
                '@path': '$.properties.close_date'
              },
              name: {
                '@path': '$.properties.name'
              },
              stage_name: {
                '@path': '$.properties.stage_name'
              }
            },
            auth
          })
        }).rejects.toThrowErrorMatchingInlineSnapshot(
          `"Unsupported operation: Bulk API does not support the delete operation"`
        )
      })
    })

    it('should fail if syncMode is undefined', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Create Opportunity',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name',
          stage_name: 'Opportunity stage name'
        }
      })

      await expect(async () => {
        await testDestination.testBatchAction('opportunity2', {
          events: [event],
          settings,
          mapping: {
            enable_batching: true,
            close_date: {
              '@path': '$.properties.close_date'
            },
            name: {
              '@path': '$.properties.name'
            },
            stage_name: {
              '@path': '$.properties.stage_name'
            }
          },
          auth
        })
      }).rejects.toThrowErrorMatchingInlineSnapshot(`"syncMode is required"`)
    })

    it('should fail if the operation does not have name field and sync mode is upsert', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Create Opportunity',
        properties: {}
      })

      await expect(async () => {
        await testDestination.testBatchAction('opportunity2', {
          events: [event],
          settings,
          mapping: {
            enable_batching: true,
            __segment_internal_sync_mode: 'upsert',
            close_date: {
              '@path': '$.properties.close_date'
            },
            name: {
              '@path': '$.properties.name'
            },
            stage_name: {
              '@path': '$.properties.stage_name'
            }
          },
          auth
        })
      }).rejects.toThrowErrorMatchingInlineSnapshot(`"Missing close_date, name or stage_name value"`)
    })
  })
})
