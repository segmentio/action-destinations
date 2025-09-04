import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const event = createTestEvent({
  event: 'Audience Entered',
  type: 'track',
  properties: {
    audience_key: 'personas_test_audience'
  },
  context: {
    device: {
      advertisingId: '123'
    },
    traits: {
      email: 'testing@testing.com',
      phoneNumbers: '+1234567890',
      zipCodes: '12345',
      firstName: 'John',
      lastName: 'Doe',
      countryCode: 'US'
    }
  }
})

const event2 = createTestEvent({
  event: 'Audience Entered',
  type: 'track',
  properties: {
    audience_key: 'personas_test_audience'
  },
  context: {
    device: {
      advertisingId: '456'
    },
    traits: {
      email: 'testing2@testing.com',
      phoneNumbers: '+0987654321',
      zipCodes: '54321',
      firstName: 'Jane',
      lastName: 'Smith',
      countryCode: 'CA'
    }
  }
})

describe('First-Party-dv360.addToAudContactInfo', () => {
  it('should hash pii data if not already hashed', async () => {
    nock('https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('addToAudContactInfo', {
      event,
      mapping: {
        emails: ['testing@testing.com'],
        phoneNumbers: ['+1234567890'],
        zipCodes: ['12345'],
        firstName: 'John',
        lastName: 'Doe',
        countryCode: 'US',
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: false,
        batch_size: 1
      }
    })

    expect(responses[0].options.body).toMatchInlineSnapshot(
      '"{\\"advertiserId\\":\\"1234567890\\",\\"addedContactInfoList\\":{\\"contactInfos\\":[{\\"hashedEmails\\":\\"584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777\\",\\"hashedPhoneNumbers\\":\\"422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8\\",\\"zipCodes\\":\\"12345\\",\\"hashedFirstName\\":\\"96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a\\",\\"hashedLastName\\":\\"799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f\\",\\"countryCode\\":\\"US\\"}],\\"consent\\":{\\"adUserData\\":\\"CONSENT_STATUS_GRANTED\\",\\"adPersonalization\\":\\"CONSENT_STATUS_GRANTED\\"}}}"'
    )
  })

  it('should not hash pii data if already hashed', async () => {
    nock('https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('addToAudContactInfo', {
      event,
      mapping: {
        emails: ['584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'],
        phoneNumbers: ['422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'],
        zipCodes: ['12345'],
        firstName: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
        lastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
        countryCode: 'US',
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: false,
        batch_size: 1
      }
    })

    expect(responses[0].options.body).toMatchInlineSnapshot(
      '"{\\"advertiserId\\":\\"1234567890\\",\\"addedContactInfoList\\":{\\"contactInfos\\":[{\\"hashedEmails\\":\\"584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777\\",\\"hashedPhoneNumbers\\":\\"422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8\\",\\"zipCodes\\":\\"12345\\",\\"hashedFirstName\\":\\"96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a\\",\\"hashedLastName\\":\\"799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f\\",\\"countryCode\\":\\"US\\"}],\\"consent\\":{\\"adUserData\\":\\"CONSENT_STATUS_GRANTED\\",\\"adPersonalization\\":\\"CONSENT_STATUS_GRANTED\\"}}}"'
    )
  })

  it('should handle batch requests with multiple payloads', async () => {
    nock('https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { success: true })

    const responses = await testDestination.testBatchAction('addToAudContactInfo', {
      events: [event, event2],
      mapping: {
        emails: {
          '@arrayPath': [
            '$.context.traits.email'
          ]
        },
        phoneNumbers: {
          '@arrayPath': [
            '$.context.traits.phoneNumbers'
          ]
        },
        zipCodes: {
          '@arrayPath': [
            '$.context.traits.zipCodes'
          ]
        },
        firstName: {
          '@path': '$.context.traits.firstName'
        },
        lastName: {
          '@path': '$.context.traits.lastName'
        },
        countryCode: {
          '@path': '$.context.traits.countryCode'
        },
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: true,
        batch_size: 10
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    
    // Parse the request body to verify it contains both contact infos
    const requestBody = JSON.parse(responses[0].options.body as string)
    expect(requestBody.addedContactInfoList.contactInfos).toHaveLength(2)
    
    // Verify first contact info
    expect(requestBody.addedContactInfoList.contactInfos[0]).toMatchObject({
      hashedEmails: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777',
      hashedPhoneNumbers: '422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8',
      zipCodes: '12345',
      hashedFirstName: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
      hashedLastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
      countryCode: 'US'
    })
    
    // Verify second contact info
    expect(requestBody.addedContactInfoList.contactInfos[1]).toMatchObject({
      hashedEmails: 'e67e72c0e95b2f8a00d4b8e5d7eb97c51b2ad442e1dc2dfbc0e82c11c16b1e42',
      hashedPhoneNumbers: '1234a97e4a0ad5c36dc5dd79a5031639ee2ab65ae6a0b63e16c08a92b8088f50',
      zipCodes: '54321',
      hashedFirstName: '7ba34aa26aabe4b7d32a2d824ec2c5ff82daf7ad96e0f4fc7de2e06b8d7a7b72',
      hashedLastName: '0c70e5c5c47c7e1257da04df3c2ca4ce05e3cbb6e5d5a3dbf8fbcae2b6e47e52',
      countryCode: 'CA'
    })
  })

  it('should filter out payloads without required identifiers in batch', async () => {
    nock('https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { success: true })

    const eventWithoutIdentifiers = createTestEvent({
      event: 'Audience Entered',
      type: 'track',
      properties: {
        audience_key: 'personas_test_audience'
      },
      context: {
        traits: {
          // No email, phone, firstName, or lastName
          zipCodes: '99999',
          countryCode: 'FR'
        }
      }
    })

    const responses = await testDestination.testBatchAction('addToAudContactInfo', {
      events: [event, eventWithoutIdentifiers, event2],
      mapping: {
        emails: {
          '@arrayPath': [
            '$.context.traits.email'
          ]
        },
        phoneNumbers: {
          '@arrayPath': [
            '$.context.traits.phoneNumbers'
          ]
        },
        zipCodes: {
          '@arrayPath': [
            '$.context.traits.zipCodes'
          ]
        },
        firstName: {
          '@path': '$.context.traits.firstName'
        },
        lastName: {
          '@path': '$.context.traits.lastName'
        },
        countryCode: {
          '@path': '$.context.traits.countryCode'
        },
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: true,
        batch_size: 10
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    
    // Parse the request body to verify it only contains 2 contact infos (filtered out the invalid one)
    const requestBody = JSON.parse(responses[0].options.body as string)
    expect(requestBody.addedContactInfoList.contactInfos).toHaveLength(2)
  })
})
