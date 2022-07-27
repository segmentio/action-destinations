import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const SETTINGS = {
  apiToken: 'VALID_API_TOKEN',
  datacenter: 'testdc'
}
const DIRECTORY_ID = 'POOL_XXXX'
const CONTACT_INFO = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'janedoe@email.com',
  phone: '0005551234',
  extRef: 'user_id_1',
  language: 'en',
  region: 'region'
}

describe('addContactToXmd', () => {
  it('should send a valid action with default mapping', async () => {
    nock('https://testdc.qualtrics.com')
      .post(`/API/v3/directories/${DIRECTORY_ID}/contacts`)
      .matchHeader('x-api-token', 'VALID_API_TOKEN')
      .reply(200, {})

    const event = createTestEvent({
      userId: CONTACT_INFO.extRef,
      traits: {
        directoryId: DIRECTORY_ID,
        firstName: CONTACT_INFO.firstName,
        lastName: CONTACT_INFO.lastName,
        email: CONTACT_INFO.email,
        phone: CONTACT_INFO.phone,
        language: CONTACT_INFO.language
      }
    })

    const response = await testDestination.testAction('addContactToXmd', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true,
      mapping: {
        directoryId: {
          '@path': '$.traits.directoryId'
        }
      }
    })

    expect(await response[0].request.json()).toMatchObject({
      extRef: CONTACT_INFO.extRef,
      firstName: CONTACT_INFO.firstName,
      lastName: CONTACT_INFO.lastName,
      email: CONTACT_INFO.email,
      phone: CONTACT_INFO.phone,
      unsubscribed: false,
      language: CONTACT_INFO.language
    })
  })

  it('should send a valid action with embeddedDataMapping', async () => {
    nock('https://testdc.qualtrics.com')
      .post(`/API/v3/directories/${DIRECTORY_ID}/contacts`)
      .matchHeader('x-api-token', 'VALID_API_TOKEN')
      .reply(200, {})

    const event = createTestEvent({
      userId: CONTACT_INFO.extRef,
      traits: {
        directoryId: DIRECTORY_ID,
        firstName: CONTACT_INFO.firstName,
        lastName: CONTACT_INFO.lastName,
        email: CONTACT_INFO.email,
        phone: CONTACT_INFO.phone,
        region: CONTACT_INFO.region
      }
    })

    const response = await testDestination.testAction('addContactToXmd', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true,
      mapping: {
        directoryId: {
          '@path': '$.traits.directoryId'
        },
        embeddedData: {
          region: {
            '@path': '$.traits.region'
          }
        }
      }
    })

    expect(await response[0].request.json()).toMatchObject({
      extRef: CONTACT_INFO.extRef,
      firstName: CONTACT_INFO.firstName,
      lastName: CONTACT_INFO.lastName,
      email: CONTACT_INFO.email,
      phone: CONTACT_INFO.phone,
      unsubscribed: false,
      embeddedData: {
        region: CONTACT_INFO.region
      }
    })
  })

  it('should throw an error when directoryId is not mapped', async () => {
    nock('https://testdc.qualtrics.com')
      .post(`/API/v3/directories/${DIRECTORY_ID}/contacts`)
      .matchHeader('x-api-token', 'VALID_API_TOKEN')
      .reply(200, {})

    const event = createTestEvent({
      userId: CONTACT_INFO.extRef,
      traits: {}
    })

    await expect(
      testDestination.testAction('addContactToXmd', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })
})
