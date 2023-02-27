import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import dayjs from '../../../../lib/dayjs'

// Create a date object from the current time
const dateObj = dayjs()

const testDestination = createTestIntegration(Destination)
const SETTINGS = {
  apiToken: 'VALID_API_TOKEN',
  datacenter: 'testdc'
}
const DIRECTORY_ID = 'POOL_XXXX'
const CONTACT_ID = 'CID_XXXX'
const MAILING_LIST_ID = 'CG_XXXX'
const TRANSACTION_DATA = { Key: 'Value' }
// Convert the date object to formatted string
const TRANSACTION_DATE = dateObj.format('YYYY-MM-DD HH:mm:ss')
// Convert the date object to formatted string in UTC
const TRANSACTION_DATE_UTC = dateObj.utc().format('YYYY-MM-DD HH:mm:ss')
const CONTACT_INFO = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'janedoe@email.com',
  phone: '0005551234',
  extRef: 'user_id_1',
  language: 'en',
  region: 'region',
  unsubscribed: false
}
const FILTER_BODY = {
  filter: {
    conjunction: 'and',
    filters: [
      { comparison: 'eq', filterType: 'extRef', value: CONTACT_INFO.extRef },
      { comparison: 'eq', filterType: 'phone', value: CONTACT_INFO.phone },
      { comparison: 'eq', filterType: 'email', value: CONTACT_INFO.email }
    ]
  }
}

describe('upsertContactTransaction', () => {
  it('should send a valid action when a contact id is supplied', async () => {
    nock(`https://${SETTINGS.datacenter}.qualtrics.com`)
      .post(`/API/v3/directories/${DIRECTORY_ID}/transactions`)
      .matchHeader('x-api-token', SETTINGS.apiToken)
      .reply(200, {})

    const event = createTestEvent({
      userId: CONTACT_INFO.extRef,
      traits: {
        contactId: CONTACT_ID,
        directoryId: DIRECTORY_ID,
        mailingListId: MAILING_LIST_ID,
        transactionData: TRANSACTION_DATA,
        transactionDate: TRANSACTION_DATE
      }
    })

    const response = await testDestination.testAction('upsertContactTransaction', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true,
      mapping: {
        directoryId: {
          '@path': '$.traits.directoryId'
        },
        mailingListId: {
          '@path': '$.traits.mailingListId'
        },
        contactId: {
          '@path': '$.traits.contactId'
        },
        transactionData: {
          '@path': '$.traits.transactionData'
        },
        transactionDate: {
          '@path': '$.traits.transactionDate'
        }
      }
    })
    const actualRequest = await response[0].request.json()
    expect(actualRequest[Object.keys(actualRequest)[0]]).toMatchObject({
      contactId: CONTACT_ID,
      data: TRANSACTION_DATA,
      transactionDate: TRANSACTION_DATE_UTC,
      mailingListId: MAILING_LIST_ID
    })
  })
  it('should send a valid action when a contact id is not supplied and the contact search succeeds', async () => {
    nock(`https://${SETTINGS.datacenter}.qualtrics.com`)
      .post(`/API/v3/directories/${DIRECTORY_ID}/contacts/search`)
      .matchHeader('x-api-token', SETTINGS.apiToken)
      .reply(200, { result: { elements: [{ id: 'CID_FOUND' }] } })

    nock(`https://${SETTINGS.datacenter}.qualtrics.com`)
      .post(`/API/v3/directories/${DIRECTORY_ID}/transactions`)
      .matchHeader('x-api-token', SETTINGS.apiToken)
      .reply(200, {})

    const event = createTestEvent({
      userId: CONTACT_INFO.extRef,
      traits: {
        directoryId: DIRECTORY_ID,
        mailingListId: MAILING_LIST_ID,
        transactionData: TRANSACTION_DATA,
        transactionDate: TRANSACTION_DATE,
        extRef: CONTACT_INFO.extRef,
        email: CONTACT_INFO.email,
        phone: CONTACT_INFO.phone
      }
    })

    const response = await testDestination.testAction('upsertContactTransaction', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true,
      mapping: {
        directoryId: {
          '@path': '$.traits.directoryId'
        },
        mailingListId: {
          '@path': '$.traits.mailingListId'
        },
        email: {
          '@path': '$.traits.email'
        },
        phone: {
          '@path': '$.traits.phone'
        },
        extRef: {
          '@path': '$.traits.extRef'
        },
        transactionData: {
          '@path': '$.traits.transactionData'
        },
        transactionDate: {
          '@path': '$.traits.transactionDate'
        }
      }
    })
    const actualSearchRequest = await response[0].request.json()
    expect(actualSearchRequest).toMatchObject(FILTER_BODY)

    const actualCreateTransactionRequest = await response[1].request.json()
    expect(actualCreateTransactionRequest[Object.keys(actualCreateTransactionRequest)[0]]).toMatchObject({
      contactId: 'CID_FOUND',
      data: TRANSACTION_DATA,
      transactionDate: TRANSACTION_DATE_UTC,
      mailingListId: MAILING_LIST_ID
    })
  })
  it('should send a valid action when a contact id is not supplied, search fails to find and a new contact is created', async () => {
    nock(`https://${SETTINGS.datacenter}.qualtrics.com`)
      .post(`/API/v3/directories/${DIRECTORY_ID}/contacts/search`)
      .matchHeader('x-api-token', SETTINGS.apiToken)
      .reply(200, { result: { elements: [] } })

    nock(`https://${SETTINGS.datacenter}.qualtrics.com`)
      .post(`/API/v3/directories/${DIRECTORY_ID}/contacts`)
      .matchHeader('x-api-token', SETTINGS.apiToken)
      .reply(200, { result: { id: 'CID_CREATED' } })

    nock(`https://${SETTINGS.datacenter}.qualtrics.com`)
      .post(`/API/v3/directories/${DIRECTORY_ID}/transactions`)
      .matchHeader('x-api-token', SETTINGS.apiToken)
      .reply(200, {})

    const event = createTestEvent({
      userId: CONTACT_INFO.extRef,
      traits: {
        directoryId: DIRECTORY_ID,
        mailingListId: MAILING_LIST_ID,
        transactionData: TRANSACTION_DATA,
        transactionDate: TRANSACTION_DATE,
        extRef: CONTACT_INFO.extRef,
        firstName: CONTACT_INFO.firstName,
        lastName: CONTACT_INFO.lastName,
        email: CONTACT_INFO.email,
        phone: CONTACT_INFO.phone,
        language: CONTACT_INFO.language,
        unsubscribed: CONTACT_INFO.unsubscribed
      }
    })

    const response = await testDestination.testAction('upsertContactTransaction', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true,
      mapping: {
        directoryId: {
          '@path': '$.traits.directoryId'
        },
        mailingListId: {
          '@path': '$.traits.mailingListId'
        },
        email: {
          '@path': '$.traits.email'
        },
        phone: {
          '@path': '$.traits.phone'
        },
        extRef: {
          '@path': '$.traits.extRef'
        },
        firstName: {
          '@path': '$.traits.firstName'
        },
        lastName: {
          '@path': '$.traits.lastName'
        },
        language: {
          '@path': '$.traits.language'
        },
        transactionData: {
          '@path': '$.traits.transactionData'
        },
        transactionDate: {
          '@path': '$.traits.transactionDate'
        }
      }
    })
    const actualSearchRequest = await response[0].request.json()
    expect(actualSearchRequest).toMatchObject(FILTER_BODY)

    const actualCreateContactRequest = await response[1].request.json()
    expect(actualCreateContactRequest).toMatchObject({
      extRef: CONTACT_INFO.extRef,
      firstName: CONTACT_INFO.firstName,
      lastName: CONTACT_INFO.lastName,
      email: CONTACT_INFO.email,
      phone: CONTACT_INFO.phone,
      language: CONTACT_INFO.language,
      unsubscribed: CONTACT_INFO.unsubscribed
    })

    const actualCreateTransactionRequest = await response[2].request.json()
    expect(actualCreateTransactionRequest[Object.keys(actualCreateTransactionRequest)[0]]).toMatchObject({
      contactId: 'CID_CREATED',
      data: TRANSACTION_DATA,
      transactionDate: TRANSACTION_DATE_UTC,
      mailingListId: MAILING_LIST_ID
    })
  })
})
