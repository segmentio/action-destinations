import { createTestEvent } from '@segment/actions-core'
import { ContactBatchResponse } from '../../../upsertContact'

export type BatchContactListItem = {
  id?: string
  email: string
  firstname: string
  lastname: string
  lifecyclestage?: string | undefined
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
        lifecyclestage: contact?.lifecyclestage ?? 'subscriber',
        company: 'Some Company',
        phone: '+13134561129',
        website: 'somecompany.com'
      }
    })
  )

export const generateBatchReadResponse = (batchContactList: BatchContactListItem[]) => {
  const batchReadResponse: ContactBatchResponse = {
    status: 'COMPLETE',
    results: [],
    numErrors: 0,
    errors: []
  }

  const notFoundEmails: string[] = []

  for (const contact of batchContactList) {
    // Set success response
    if (contact.id) {
      batchReadResponse.results.push({
        id: contact.id,
        properties: {
          createdate: '2023-07-06T12:47:47.626Z',
          email: contact.email,
          hs_object_id: contact.id,
          lastmodifieddate: '2023-07-06T12:48:02.784Z'
        }
      })
    } else {
      // Push to not found list if id is not present
      notFoundEmails.push(contact.email)
    }
  }

  // Set error response
  if (notFoundEmails.length > 0) {
    batchReadResponse.numErrors = 1
    batchReadResponse.errors = [
      {
        status: 'error',
        category: 'OBJECT_NOT_FOUND',
        message: 'Could not get some CONTACT objects, they may be deleted or not exist. Check that ids are valid.',
        context: {
          ids: notFoundEmails
        }
      }
    ]
  }

  return batchReadResponse
}

export const generateBatchCreateResponse = (batchContactList: BatchContactListItem[]) => {
  const batchCreateResponse: ContactBatchResponse = {
    status: 'COMPLETE',
    results: []
  }

  batchContactList.forEach((contact, index) => {
    // Set success response
    // if (!contact.id) {
    const contactResponse: any = {
      id: contact.id ? contact.id : (101 + index).toString(),
      properties: {
        email: contact.email,
        firstname: contact.firstname,
        lastname: contact.lastname,
        createdate: '2023-07-06T12:47:47.626Z',
        lastmodifieddate: '2023-07-06T12:48:02.784Z'
      }
    }
    if (Object.prototype.hasOwnProperty.call(contact, 'lifecyclestage')) {
      contactResponse.properties.lifecyclestage = contact.lifecyclestage
    }

    batchCreateResponse.results.push(contactResponse)
    // }
  })

  return batchCreateResponse
}
