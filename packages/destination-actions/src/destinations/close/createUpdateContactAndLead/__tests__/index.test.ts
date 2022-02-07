import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const TEST_USER_1 = {
  id: 'user_id_1',
  company_name: 'My Company',
  name: 'John',
  email: 'john@example.com',
  title: 'Manager',
  phone: '+1 800 444 4444',
  website: 'https://example.org',
  business_plan: 'Enterprise'
}
const SETTINGS: Settings = {
  api_key: 'api_keyid.keysecret',
  contact_custom_field_id_for_user_id: 'cf_external_user_id'
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
          contact_external_id: TEST_USER_1.id
        },
        settings: { contact_custom_field_id_for_user_id: 'cf_external_user_id' }
      })
      .matchHeader('Authorization', 'Basic YXBpX2tleWlkLmtleXNlY3JldDo=')
      .reply(202, '')

    const event = createTestEvent({
      userId: 'user_id_1',
      traits: {
        company: {
          name: TEST_USER_1.company_name
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

  it('should call action with contact_custom_fields mappings', async () => {
    nock('https://services.close.com/', { encodedQueryParams: true })
      .post('/webhooks/segment/actions/create-update-contact-and-lead/', {
        action_payload: {
          contact_external_id: TEST_USER_1.id,
          contact_custom_fields: { cf_business_plan: 'Enterprise' }
        },
        settings: { contact_custom_field_id_for_user_id: 'cf_external_user_id' }
      })
      .matchHeader('Authorization', 'Basic YXBpX2tleWlkLmtleXNlY3JldDo=')
      .reply(202, '')

    const event = createTestEvent({
      userId: 'user_id_1',
      traits: {
        business_plan: 'Enterprise'
      }
    })

    // Define mapping for business plan custom field
    const mapping = {
      contact_custom_fields: {
        cf_business_plan: {
          '@path': '$.traits.business_plan'
        }
      }
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
