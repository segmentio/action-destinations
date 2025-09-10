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

  it('should batch multiple payloads into a single request when enable_batching is true', async () => {
    nock('https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { success: true })

    const events = createBatchTestEvents(createContactList)
    const responses = await testDestination.testBatchAction('addToAudContactInfo', {
      events: events,
      mapping: {
        emails: ['584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'],
        phoneNumbers: ['422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'],
        zipCodes: ['12345'],
        firstName: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
        lastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
        countryCode: 'US',
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: true,
        batch_size: 2
      }
    })

    const requestBody = JSON.parse(String(responses[0].options.body))
    expect(requestBody.addedContactInfoList.contactInfos.length).toBe(2)
    expect(requestBody.addedContactInfoList.contactInfos[0].hashedEmails).toBeDefined()
    expect(requestBody.addedContactInfoList.contactInfos[1].hashedEmails).toBeDefined()
    // Optionally, check that the emails are correctly hashed and correspond to the input
  })

  it('should batch multiple payloads into a single request when enable_batching is true (feature flag ON, v4)', async () => {
    nock('https://displayvideo.googleapis.com/v4/firstPartyAndPartnerAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { success: true })

    const events = createBatchTestEvents(createContactList)
    const responses = await testDestination.testBatchAction('addToAudContactInfo', {
      events: events,
      mapping: {
        emails: ['584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'],
        phoneNumbers: ['422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'],
        zipCodes: ['12345'],
        firstName: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
        lastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
        countryCode: 'US',
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: true,
        batch_size: 2
      },
      features: { 'actions-first-party-dv360-version-update': true }
    })

    const requestBody = JSON.parse(String(responses[0].options.body))
    expect(requestBody.addedContactInfoList.contactInfos.length).toBe(2)
    expect(requestBody.addedContactInfoList.contactInfos[0].hashedEmails).toBeDefined()
    expect(requestBody.addedContactInfoList.contactInfos[1].hashedEmails).toBeDefined()
  })

  it('should batch multiple payloads into a single request when enable_batching is true (feature flag OFF, v3)', async () => {
    nock('https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { success: true })

    const events = createBatchTestEvents(createContactList)
    const responses = await testDestination.testBatchAction('addToAudContactInfo', {
      events: events,
      mapping: {
        emails: ['584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'],
        phoneNumbers: ['422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'],
        zipCodes: ['12345'],
        firstName: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
        lastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
        countryCode: 'US',
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: true,
        batch_size: 2
      },
      features: { 'actions-first-party-dv360-version-update': false }
    })

    const requestBody = JSON.parse(String(responses[0].options.body))
    expect(requestBody.addedContactInfoList.contactInfos.length).toBe(2)
    expect(requestBody.addedContactInfoList.contactInfos[0].hashedEmails).toBeDefined()
    expect(requestBody.addedContactInfoList.contactInfos[1].hashedEmails).toBeDefined()
  })
})

export type BatchContactListItem = {
  id?: string
  email: string
  firstname: string
  lastname: string
}

export const createBatchTestEvents = (batchContactList: BatchContactListItem[]) =>
  batchContactList.map((contact) =>
    createTestEvent({
      type: 'identify',
      traits: {
        email: contact.email,
        firstname: contact.firstname,
        lastname: contact.lastname,
        address: {
          city: 'San Francisco',
          country: 'USA',
          postal_code: '600001',
          state: 'California',
          street: 'Vancover st'
        },
        graduation_date: 1664533942262,
        company: 'Some Company',
        phone: '+13134561129',
        website: 'somecompany.com'
      }
    })
  )

const createContactList: BatchContactListItem[] = [
  {
    email: 'userone@somecompany.com',
    firstname: 'User',
    lastname: 'One'
  },
  {
    email: 'usertwo@somecompany.com',
    firstname: 'User',
    lastname: 'Two'
  }
]
