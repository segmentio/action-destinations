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
      hashedEmails: 'f9b0f73e2d723f122e24fddfebf37978c09a31b8530be10dccf51e6a4c49cbfa',
      hashedPhoneNumbers: '75bfc57aed345daba0e4394b604a334c87ab5f7b1c04dfdb649bcc457c182fa9',
      zipCodes: '54321',
      hashedFirstName: '81f8f6dde88365f3928796ec7aa53f72820b06db8664f5fe76a7eb13e24546a2',
      hashedLastName: '6627835f988e2c5e50533d491163072d3f4f41f5c8b04630150debb3722ca2dd',
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

  it('should handle single payload in batch properly', async () => {
    nock('https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { success: true })

    const responses = await testDestination.testBatchAction('addToAudContactInfo', {
      events: [event],
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
    
    // Parse the request body to verify it contains 1 contact info
    const requestBody = JSON.parse(responses[0].options.body as string)
    expect(requestBody.addedContactInfoList.contactInfos).toHaveLength(1)
    expect(requestBody.addedContactInfoList.contactInfos[0]).toMatchObject({
      hashedEmails: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777',
      hashedPhoneNumbers: '422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8',
      zipCodes: '12345',
      hashedFirstName: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
      hashedLastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
      countryCode: 'US'
    })
  })
})
