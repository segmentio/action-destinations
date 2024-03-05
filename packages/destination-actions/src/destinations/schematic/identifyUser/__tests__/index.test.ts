import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)


describe('POST identify call', () => {

  it('should update a user', async () => {
    
    const schematicPayload = {
      "api_key": "test",
      "type": "identify",
      "sent_at": "2023-11-07T05:31:56.000Z",
      "body": {
        "keys": {
          "user_id": "3456"
        },
        "name": "simpson",
        "traits": {
          "company_name": "company name 1",
          "email": "homer@simpsons.com",
          "name": "simpson",
          "age": 42,
          "source": "facebook"
        },
        "company": {
          "keys": {
            "company_key_1": "company_value_1"
          },
          "name": "company name 1",
          "traits": {
            "trait_1": "value_1"
          }
        }
      }
    }
    

    nock('https://c.schematichq.com').post('/e').reply(200, schematicPayload)

    const event = createTestEvent({
      type: 'identify',
      userId: '3456',
      timestamp: '2023-11-07T05:31:56Z',
      traits: {
        company_name: 'company name 1',
        email: 'homer@simpsons.com',
        name: 'simpson',
        age: 42,
        source: 'facebook'
      }
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings: {
        apiKey: 'test'
      },
      mapping: {
        company_keys: {company_key_1: 'company_value_1'},
        company_name:  { '@path': '$.traits.company_name' },
        company_traits: { trait_1: 'value_1'},
        user_keys: {user_id: '3456'},
        user_name: { '@path': '$.traits.name' },
        sent_at:  { '@path': '$.timestamp' },
        user_traits: {'@path': '$.traits'}
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject(schematicPayload)
  })
})
