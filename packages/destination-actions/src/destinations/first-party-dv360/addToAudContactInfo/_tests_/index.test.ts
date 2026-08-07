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
    nock('https://displayvideo.googleapis.com/v4/firstPartyAndPartnerAudiences')
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

  it('should hash pii data if not already hashed, with journey_step computation_class', async () => {
    // addToAudContactInfo's perform() never reads context.personas.computation_class (add vs remove is
    // determined solely by which action is invoked), so a Journeys 'journey_step' payload must behave
    // identically to the classic Engage 'audience' payload used in the test above.
    nock('https://displayvideo.googleapis.com/v4/firstPartyAndPartnerAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { success: true })

    const journeyStepEvent = createTestEvent({
      ...event,
      context: {
        ...event.context,
        personas: {
          computation_class: 'journey_step'
        }
      }
    })

    const responses = await testDestination.testAction('addToAudContactInfo', {
      event: journeyStepEvent,
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
    nock('https://displayvideo.googleapis.com/v4/firstPartyAndPartnerAudiences')
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
      }
    })

    const requestBody = JSON.parse(String(responses[0].options.body))
    expect(requestBody.addedContactInfoList.contactInfos.length).toBe(2)
    expect(requestBody.addedContactInfoList.contactInfos[0].hashedEmails).toBeDefined()
    expect(requestBody.addedContactInfoList.contactInfos[1].hashedEmails).toBeDefined()
    // Optionally, check that the emails are correctly hashed and correspond to the input
  })

  it('should batch multiple payloads into a single request when enable_batching is true ( CANARY VERSION )', async () => {
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
      features: { 'first-party-dv360-canary-version': true }
    })

    const requestBody = JSON.parse(String(responses[0].options.body))
    expect(requestBody.addedContactInfoList.contactInfos.length).toBe(2)
    expect(requestBody.addedContactInfoList.contactInfos[0].hashedEmails).toBeDefined()
    expect(requestBody.addedContactInfoList.contactInfos[1].hashedEmails).toBeDefined()
  })

  it('should route the "Journeys Step Entered" preset through addToAudContactInfo with the correct payload', async () => {
    const preset = Destination.presets?.find((p) => p.name === 'Journeys Step Entered')
    if (!preset) {
      throw new Error('Expected to find preset')
    }
    expect(preset?.partnerAction).toBe('addToAudContactInfo')
    expect(preset?.type).toBe('specificEvent')
    expect((preset as { eventSlug?: string })?.eventSlug).toBe('journeys_step_entered_track')

    nock('https://displayvideo.googleapis.com/v4/firstPartyAndPartnerAudiences')
      .post('/9876543210:editCustomerMatchMembers')
      .reply(200, { success: true })

    // This preset has no FQL `subscribe` filter — it's matched purely by eventSlug — so build a
    // realistic Journeys "step entered" track event carrying the fields the preset's (default)
    // mapping reads from.
    const journeyEvent = createTestEvent({
      type: 'track',
      event: 'Journey Step Entered',
      properties: {
        journey_metadata: {
          journey_id: 'test-journey-id',
          journey_name: 'test-journey-name',
          step_id: 'test-step-id',
          step_name: 'test-step-name'
        }
      },
      context: {
        personas: {
          external_audience_id: '9876543210',
          audience_settings: {
            advertiserId: '1112223333'
          }
        },
        traits: {
          emails: 'journeys@testing.com',
          phoneNumbers: '+19876543210',
          zipCodes: '54321',
          firstName: 'Jane',
          lastName: 'Doe',
          countryCode: 'US'
        }
      }
    })

    const responses = await testDestination.testAction(preset.partnerAction, {
      event: journeyEvent,
      mapping: preset.mapping,
      useDefaultMappings: false
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)

    const requestBody = JSON.parse(String(responses[0].options.body))
    expect(requestBody.advertiserId).toBe('1112223333')
    expect(requestBody.addedContactInfoList.contactInfos).toHaveLength(1)
    expect(requestBody.addedContactInfoList.contactInfos[0]).toMatchObject({
      hashedEmails: expect.any(String),
      hashedPhoneNumbers: expect.any(String),
      zipCodes: '54321',
      hashedFirstName: expect.any(String),
      hashedLastName: expect.any(String),
      countryCode: 'US'
    })
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
