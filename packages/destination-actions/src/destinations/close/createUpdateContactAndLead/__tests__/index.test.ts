import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const TEST_USER_1 = {
  id: 'user_id_1',
  company_name: 'My Company',
  company_id: 'company_id_1',
  company_description: 'Company description',
  name: 'John',
  email: 'john@example.com',
  title: 'Manager',
  phone: '+1 800 444 4444',
  website: 'https://example.org',
  business_plan: 'Enterprise',
  lead_status_id: 'stat_1234'
}
const SETTINGS: Settings = {
  api_key: 'api_keyid.keysecret',
  contact_custom_field_id_for_user_id: 'cf_external_user_id',
  lead_custom_field_id_for_company_id: 'cf_external_company_id'
}
const testDestination = createTestIntegration(Destination)
describe('Close.createUpdateContactAndLead', () => {
  it('should call action with default mappings', async () => {
    nock('https://services.close.com/', { encodedQueryParams: true })
      .post('/webhooks/segment/actions/create-update-contact-and-lead/', {
        action_payload: {
          lead_name: TEST_USER_1.company_name,
          contact_name: TEST_USER_1.name,
          contact_email: TEST_USER_1.email,
          contact_phone: TEST_USER_1.phone,
          contact_url: TEST_USER_1.website,
          contact_title: TEST_USER_1.title,
          contact_external_id: TEST_USER_1.id,
          lead_external_id: TEST_USER_1.company_id
        },
        settings: {
          contact_custom_field_id_for_user_id: 'cf_external_user_id',
          lead_custom_field_id_for_company_id: 'cf_external_company_id',
          allow_creating_new_leads: true,
          allow_updating_existing_leads: true,
          allow_creating_new_contacts: true,
          allow_updating_existing_contacts: true,
          allow_creating_duplicate_contacts: true
        }
      })
      .matchHeader('Authorization', 'Basic YXBpX2tleWlkLmtleXNlY3JldDo=')
      .reply(202, '')

    const event = createTestEvent({
      userId: 'user_id_1',
      traits: {
        company: {
          name: TEST_USER_1.company_name,
          id: TEST_USER_1.company_id
        },
        name: TEST_USER_1.name,
        email: TEST_USER_1.email,
        phone: TEST_USER_1.phone,
        website: TEST_USER_1.website,
        title: TEST_USER_1.title,
        business_plan: TEST_USER_1.business_plan
      }
    })

    await testDestination.testAction('createUpdateContactAndLead', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })
    expect(nock.isDone()).toBe(true)
  })

  it('should call action with lead and contact custom fields mappings', async () => {
    nock('https://services.close.com/', { encodedQueryParams: true })
      .post('/webhooks/segment/actions/create-update-contact-and-lead/', {
        action_payload: {
          contact_external_id: TEST_USER_1.id,
          contact_custom_fields: { cf_business_plan: 'Enterprise' },
          lead_custom_fields: { lf_company_size: 5 },
          lead_description: TEST_USER_1.company_description,
          lead_status_id: TEST_USER_1.lead_status_id
        },
        settings: {
          contact_custom_field_id_for_user_id: 'cf_external_user_id',
          lead_custom_field_id_for_company_id: 'cf_external_company_id',
          allow_creating_new_leads: false,
          allow_updating_existing_leads: false,
          allow_creating_new_contacts: false,
          allow_updating_existing_contacts: false,
          allow_creating_duplicate_contacts: false
        }
      })
      .matchHeader('Authorization', 'Basic YXBpX2tleWlkLmtleXNlY3JldDo=')
      .reply(202, '')

    const event = createTestEvent({
      userId: 'user_id_1',
      traits: {
        business_plan: 'Enterprise',
        company: {
          size: 5
        },
        company_description: TEST_USER_1.company_description,
        lead_status_id: TEST_USER_1.lead_status_id
      }
    })

    // Define mapping for business plan custom field
    const mapping = {
      contact_custom_fields: {
        cf_business_plan: {
          '@path': '$.traits.business_plan'
        }
      },
      lead_custom_fields: {
        lf_company_size: {
          '@path': '$.traits.company.size'
        }
      },
      lead_description: {
        '@path': '$.traits.company_description'
      },
      lead_status_id: {
        '@path': '$.traits.lead_status_id'
      },
      allow_creating_new_leads: false,
      allow_updating_existing_leads: false,
      allow_creating_new_contacts: false,
      allow_updating_existing_contacts: false,
      allow_creating_duplicate_contacts: false
    }
    await testDestination.testAction('createUpdateContactAndLead', {
      event,
      settings: SETTINGS,
      mapping,
      useDefaultMappings: true
    })
    expect(nock.isDone()).toBe(true)
  })
})
