import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError, RetryableError } from '@segment/actions-core'
import Destination from '../../index'
import { SKY_API_BASE_URL } from '../../constants'
import {
  addressPayloadWithUpdatedStreet,
  addressPayloadUpdated,
  constituentPayload,
  constituentPayloadNoEmail,
  constituentPayloadWithLookupId,
  emailPayloadPersonal,
  emailPayloadUpdated,
  identifyEventData,
  identifyEventDataNoEmail,
  identifyEventDataNoLastName,
  identifyEventDataWithInvalidWebsite,
  identifyEventDataWithLookupId,
  identifyEventDataUpdated,
  onlinePresencePayloadUpdated,
  phonePayloadUpdated
} from './fixtures'

const testDestination = createTestIntegration(Destination)

const mapping = {
  properties: {
    address: {
      type: {
        '@path': '$.traits.address_type'
      }
    },
    email: {
      type: {
        '@path': '$.traits.email_type'
      }
    },
    lookup_id: {
      '@path': '$.traits.lookup_id'
    },
    online_presence: {
      type: {
        '@path': '$.traits.website_type'
      }
    },
    phone: {
      type: {
        '@path': '$.traits.phone_type'
      }
    }
  }
}

describe('BlackbaudRaisersEdgeNxt.createOrUpdateIndividualConstituent', () => {
  test('should create a new constituent successfully', async () => {
    const event = createTestEvent(identifyEventData)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 0,
        value: []
      })

    nock(SKY_API_BASE_URL).post('/constituents', constituentPayload).reply(200, {
      id: '123'
    })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should create a new constituent without email or lookup_id successfully', async () => {
    const event = createTestEvent(identifyEventDataNoEmail)

    nock(SKY_API_BASE_URL).post('/constituents', constituentPayloadNoEmail).reply(200, {
      id: '456'
    })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should update an existing constituent matched by email successfully', async () => {
    const event = createTestEvent(identifyEventDataUpdated)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '123',
            address: 'PO Box 963\r\nNew York City, NY 10108',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/addresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '1000',
            address_lines: 'PO Box 963',
            city: 'New York City',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: 'PO Box 963\r\nNew York City, NY 10108',
            inactive: false,
            postal_code: '10108',
            preferred: true,
            state: 'NY',
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/addresses', {
        ...addressPayloadUpdated,
        constituent_id: '123'
      })
      .reply(200, {
        id: '1001'
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/emailaddresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '2000',
            address: 'john@example.biz',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_email: false,
            inactive: false,
            primary: true,
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL).patch('/emailaddresses/9876', emailPayloadUpdated).reply(200)

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/onlinepresences?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '3000',
            address: 'https://www.facebook.com/john.doe',
            constituent_id: '123',
            inactive: false,
            primary: true,
            type: 'Facebook'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/onlinepresences', {
        ...onlinePresencePayloadUpdated,
        constituent_id: '123'
      })
      .reply(200, {
        id: '3001'
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/phones?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '4000',
            constituent_id: '123',
            do_not_call: false,
            inactive: false,
            number: '+18774466722',
            primary: true,
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/phones', {
        ...phonePayloadUpdated,
        constituent_id: '123'
      })
      .reply(200, {
        id: '4001'
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should update an existing constituent matched by lookup_id successfully', async () => {
    const event = createTestEvent(identifyEventDataWithLookupId)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=lookup_id&search_text=abcd1234')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '123',
            address: '11 Wall St\r\nNew York, NY 1005',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    nock(SKY_API_BASE_URL).patch('/constituents/123', constituentPayloadWithLookupId).reply(200)

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/addresses?include_inactive=true')
      .reply(200, {
        count: 2,
        value: [
          {
            id: '1000',
            address_lines: 'PO Box 963',
            city: 'New York City',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: 'PO Box 963\r\nNew York City, NY 10108',
            inactive: false,
            postal_code: '10108',
            preferred: true,
            state: 'NY',
            type: 'Home'
          },
          {
            id: '1001',
            address_lines: '11 Wall St',
            city: 'New York',
            constituent_id: '123',
            date_added: '2023-01-02T01:01:01.000-05:00',
            date_modified: '2023-01-02T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: '11 Wall Street\r\nNew York, NY 10005',
            inactive: false,
            postal_code: '10005',
            preferred: true,
            state: 'NY',
            type: 'Work'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/addresses', {
        ...addressPayloadWithUpdatedStreet,
        constituent_id: '123'
      })
      .reply(200, {
        id: '1002'
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/emailaddresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '2000',
            address: 'john@example.biz',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_email: false,
            inactive: false,
            primary: true,
            type: 'Work'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/emailaddresses', {
        ...emailPayloadPersonal,
        constituent_id: '123'
      })
      .reply(200, {
        id: '2001'
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should throw an IntegrationError if multiple records matched', async () => {
    const event = createTestEvent(identifyEventData)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 2,
        value: [
          {
            id: '123',
            address: '11 Wall Street\r\nNew York, NY 10005',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          },
          {
            id: '1234',
            address: '100 Main St\r\nLos Angeles, CA 90210',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(
      new IntegrationError('Multiple records returned for given traits', 'MULTIPLE_EXISTING_RECORDS', 400)
    )
  })

  test('should throw a RetryableError if constituent search returns a 429', async () => {
    const event = createTestEvent(identifyEventData)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(429)

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new RetryableError('429 error returned when searching for constituent'))
  })

  test('should throw an IntegrationError if new constituent has no last name', async () => {
    const event = createTestEvent(identifyEventDataNoLastName)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.org')
      .reply(200, {
        count: 0,
        value: []
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new IntegrationError('Missing last name value', 'MISSING_REQUIRED_FIELD', 400))
  })

  test('should throw a RetryableError if creating new constituent returns a 429', async () => {
    const event = createTestEvent(identifyEventData)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 0,
        value: []
      })

    nock(SKY_API_BASE_URL).post('/constituents', constituentPayload).reply(429)

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new RetryableError('429 error occurred when creating constituent'))
  })

  test('should throw an IntegrationError if one or more request returns a 400 when updating an existing constituent', async () => {
    const event = createTestEvent(identifyEventDataWithInvalidWebsite)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '123',
            address: 'PO Box 963\r\nNew York City, NY 10108',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/addresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '1000',
            address_lines: 'PO Box 963',
            city: 'New York City',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: 'PO Box 963\r\nNew York City, NY 10108',
            inactive: false,
            postal_code: '10108',
            preferred: true,
            state: 'NY',
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/addresses', {
        ...addressPayloadUpdated,
        constituent_id: '123'
      })
      .reply(200, {
        id: '1001'
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/emailaddresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '2000',
            address: 'john@example.biz',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_email: false,
            inactive: false,
            primary: true,
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL).patch('/emailaddresses/9876', emailPayloadUpdated).reply(200)

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/onlinepresences?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '3000',
            address: 'https://www.facebook.com/john.doe',
            constituent_id: '123',
            inactive: false,
            primary: true,
            type: 'Facebook'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/onlinepresences', {
        ...onlinePresencePayloadUpdated,
        constituent_id: '123'
      })
      .reply(400)

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/phones?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '4000',
            constituent_id: '123',
            do_not_call: false,
            inactive: false,
            number: '+18774466722',
            primary: true,
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/phones', {
        ...phonePayloadUpdated,
        constituent_id: '123'
      })
      .reply(200, {
        id: '4001'
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(
      new IntegrationError(
        'One or more errors occurred when updating existing constituent: 400 error occurred when updating constituent online presence',
        'UPDATE_CONSTITUENT_ERROR',
        500
      )
    )
  })

  test('should throw a RetryableError if one or more request returns a 429 when updating an existing constituent', async () => {
    const event = createTestEvent(identifyEventDataUpdated)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '123',
            address: 'PO Box 963\r\nNew York City, NY 10108',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/addresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '1000',
            address_lines: 'PO Box 963',
            city: 'New York City',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: 'PO Box 963\r\nNew York City, NY 10108',
            inactive: false,
            postal_code: '10108',
            preferred: true,
            state: 'NY',
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/addresses', {
        ...addressPayloadUpdated,
        constituent_id: '123'
      })
      .reply(200, {
        id: '1001'
      })

    nock(SKY_API_BASE_URL).get('/constituents/123/emailaddresses?include_inactive=true').reply(429)

    nock(SKY_API_BASE_URL).get('/constituents/123/onlinepresences?include_inactive=true').reply(429)

    nock(SKY_API_BASE_URL).get('/constituents/123/phones?include_inactive=true').reply(429)

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(
      new RetryableError(
        'One or more errors occurred when updating existing constituent: 429 error occurred when updating constituent email, 429 error occurred when updating constituent online presence, 429 error occurred when updating constituent phone'
      )
    )
  })
})
