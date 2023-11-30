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
  }
})

const mapping = {
  domain: { '@path': '$.traits.domain' },
  workspace_id: { '@path': '$.traits.id' },
  user_id: { '@path': '$.userId' }
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
})
