import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_BASE } from '../../api'

const testDestination = createTestIntegration(Definition)
const settings = { apiKey: 'gt_live_testkey' }

afterEach(() => {
  nock.cleanAll()
})

describe('GainTrace.groupCompany', () => {
  it('upserts a company on the external id', async () => {
    let body: any
    nock(API_BASE)
      .post('/companies', (b) => {
        body = b
        return true
      })
      .reply(200, {})

    await testDestination.testAction('groupCompany', {
      settings,
      mapping: { groupId: 'acme', name: 'Acme Inc', domain: 'acme.com', employeeCount: 250 }
    })

    expect(body).toMatchObject({ externalId: 'acme', name: 'Acme Inc', domain: 'acme.com', employeeCount: 250 })
  })

  it('falls back to the company id when no name is supplied', async () => {
    let body: any
    nock(API_BASE)
      .post('/companies', (b) => {
        body = b
        return true
      })
      .reply(200, {})

    await testDestination.testAction('groupCompany', { settings, mapping: { groupId: 'acme' } })
    expect(body.name).toBe('acme')
  })

  it('sends employeeCount of zero rather than dropping it', async () => {
    let body: any
    nock(API_BASE)
      .post('/companies', (b) => {
        body = b
        return true
      })
      .reply(200, {})

    await testDestination.testAction('groupCompany', { settings, mapping: { groupId: 'acme', employeeCount: 0 } })
    expect(body.employeeCount).toBe(0)
  })
})
