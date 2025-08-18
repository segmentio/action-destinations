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
})
