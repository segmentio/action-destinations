import nock from 'nock'

import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { AssertResponse } from '../../api'

const testDestination = createTestIntegration(Destination)

const domain = 'example.com'
const event = createTestEvent({
  type: 'group' as const,
  traits: {
    id: '42',
    domain
  },
  receivedAt: '2024-05-24T10:00:00.000Z'
})

const mapping = {
  domain: { '@path': '$.traits.domain' },
  workspace_id: { '@path': '$.traits.id' },
  user_id: { '@path': '$.userId' },
  received_at: {
    '@path': '$.receivedAt'
  }
}

describe('Attio.groupWorkspace', () => {
  it('asserts a Company and then a Workspace', async () => {
    const companyResponse: AssertResponse = {
      data: {
        id: {
          workspace_id: 'workspace_id',
          object_id: 'object_id',
          record_id: 'record_id'
        },
        created_at: new Date().toISOString(),
        values: {}
      }
    }

    nock('https://api.attio.com')
      .put('/v2/objects/companies/records/simple?matching_attribute=domains&append_to_existing_values=true', {
        data: {
          values: {
            domains: domain
          }
        }
      })
      .reply(200, companyResponse)

    nock('https://api.attio.com')
      .put('/v2/objects/workspaces/records/simple?matching_attribute=workspace_id&append_to_existing_values=true', {
        data: {
          values: {
            company: 'record_id',
            workspace_id: '42',
            users: ['user1234']
          }
        }
      })
      .reply(200, {})

    const responses = await testDestination.testAction('groupWorkspace', {
      event,
      mapping,
      settings: {}
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
  })

  it('does not set a `users` property if missing from event', async () => {
    const companyResponse: AssertResponse = {
      data: {
        id: {
          workspace_id: 'workspace_id',
          object_id: 'object_id',
          record_id: 'record_id'
        },
        created_at: new Date().toISOString(),
        values: {}
      }
    }

    nock('https://api.attio.com')
      .put('/v2/objects/companies/records/simple?matching_attribute=domains&append_to_existing_values=true', {
        data: {
          values: {
            domains: domain
          }
        }
      })
      .reply(200, companyResponse)

    nock('https://api.attio.com')
      .put('/v2/objects/workspaces/records/simple?matching_attribute=workspace_id&append_to_existing_values=true', {
        data: {
          values: {
            company: 'record_id',
            workspace_id: '42'
          }
        }
      })
      .reply(200, {})

    const responses = await testDestination.testAction('groupWorkspace', {
      event: { ...event, userId: null },
      mapping,
      settings: {}
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
  })

  it('does not set a `users` property if mapping is blank', async () => {
    const companyResponse: AssertResponse = {
      data: {
        id: {
          workspace_id: 'workspace_id',
          object_id: 'object_id',
          record_id: 'record_id'
        },
        created_at: new Date().toISOString(),
        values: {}
      }
    }

    nock('https://api.attio.com')
      .put('/v2/objects/companies/records/simple?matching_attribute=domains&append_to_existing_values=true', {
        data: {
          values: {
            domains: domain
          }
        }
      })
      .reply(200, companyResponse)

    nock('https://api.attio.com')
      .put('/v2/objects/workspaces/records/simple?matching_attribute=workspace_id&append_to_existing_values=true', {
        data: {
          values: {
            company: 'record_id',
            workspace_id: '42'
          }
        }
      })
      .reply(200, {})

    const responses = await testDestination.testAction('groupWorkspace', {
      event,
      mapping: {
        ...mapping,
        user_id: ''
      },
      settings: {}
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
  })

  it('fails to assert a Company and returns', async () => {
    nock('https://api.attio.com')
      .put('/v2/objects/companies/records/simple?matching_attribute=domains&append_to_existing_values=true', {
        data: {
          values: {
            domains: domain
          }
        }
      })
      .reply(400, { error: 'Invalid matching attribute' })

    await expect(
      testDestination.testAction('groupWorkspace', {
        event,
        mapping,
        settings: {}
      })
    ).rejects.toThrowError()
  })

  it('uses the batch assertion endpoint', async () => {
    nock('https://api.attio.com')
      .put('/v2/batch/records', {
        assertions: [
          {
            object: 'workspaces',
            mode: 'create-or-update',
            matching_attribute: 'workspace_id',
            multiselect_values: 'append',
            values: {
              workspace_id: '42',
              users: ['user1234'],

              company: {
                object: 'companies',
                mode: 'create-or-update',
                matching_attribute: 'domains',
                multiselect_values: 'append',
                values: {
                  domains: domain
                },
                received_at: '2024-05-24T10:00:00.000Z'
              }
            },
            received_at: '2024-05-24T10:00:00.000Z'
          }
        ]
      })
      .reply(202, '')

    const responses = await testDestination.testBatchAction('groupWorkspace', {
      events: [event],
      mapping,
      settings: {}
    })

    expect(responses.length).toBe(2)
    expect(responses[1].status).toBe(202)
  })

  it('handles the case where receivedAt is not provided', async () => {
    const lackingReceivedAtEvent = createTestEvent({
      type: 'group' as const,
      traits: {
        id: '42',
        domain
      },
      receivedAt: undefined
    })

    // Can't control the exact timestamp, so only check it starts on the same year-month-day and is ISO8601 formatted
    const datePrefix = new Date().toISOString().split('T')[0]

    nock('https://api.attio.com')
      .put('/v2/batch/records', new RegExp(`"received_at":"${datePrefix}T`))
      .reply(202, '')

    await testDestination.testBatchAction('groupWorkspace', {
      events: [lackingReceivedAtEvent],
      mapping,
      settings: {}
    })
  })
})
