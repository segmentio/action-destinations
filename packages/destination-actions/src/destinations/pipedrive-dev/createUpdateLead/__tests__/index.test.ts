import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const PIPEDRIVE_API_KEY = 'random string'
const PIPEDRIVE_DOMAIN = 'companydomain'
const LEAD_ID = '31337'

describe('Pipedrive.createUpdateLead', () => {
  it('should create lead', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .post('/leads', { title: 'Some Name', person_id: 420 })
      .query({ api_token: PIPEDRIVE_API_KEY })
      .reply(200)

    scope
      .get(/.*/)
      .query((q) => {
        return q.field_key === 'name' && q.field_type === 'personField' && q.term === 'John Doe'
      })
      .reply(200, {
        data: [{ id: 420 }]
      })

    await testDestination.testAction('createUpdateLead', {
      mapping: { title: 'Some Name', person_match_field: 'name', person_match_value: 'John Doe' },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    expect(scope.isDone()).toBe(true)
  })

  it('should update lead', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .patch(`/leads/${LEAD_ID}`, {
        title: 'New Title',
        organization_id: 520,
        value: {
          amount: 3256.41,
          currency: 'EUR'
        }
      })
      .query({ api_token: PIPEDRIVE_API_KEY })
      .reply(200)

    scope
      .get(/.*/)
      .query((q) => {
        return q.field_key === 'someOrgField' && q.field_type === 'organizationField' && q.term === 'Pipedrive OÜ'
      })
      .reply(200, {
        data: [{ id: 520 }]
      })

    await testDestination.testAction('createUpdateLead', {
      mapping: {
        title: 'New Title',
        organization_match_field: 'someOrgField',
        organization_match_value: 'Pipedrive OÜ',
        amount: 3256.41,
        currency: 'EUR',
        lead_id: LEAD_ID
      },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    expect(scope.isDone()).toBe(true)
  })
})
