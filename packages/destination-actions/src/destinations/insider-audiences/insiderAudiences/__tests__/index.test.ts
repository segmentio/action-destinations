import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('InsiderAudiences.insiderAudiences', () => {
  it('should insert user attributes when computation class is trait and type is identify', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      context: {
        library: {
          name: 'unknown',
          version: 'unknown'
        },
        personas: {
          computation_class: 'trait',
          computation_id: 'tra_2FLcZsMQOSNGZJK4FlmP6o9VN7V',
          computation_key: 'num_link_clicked_l_60_d',
          namespace: 'spa_6W89qwt3f42uPup2nNpZnc',
          space_id: 'spa_6W89qwt3f42uPup2nNpZnc'
        }
      },
      integrations: {
        All: false,
        Appboy: true,
        Warehouses: {
          all: false
        }
      },
      event: 'Test Event',
      messageId: 'personas_2MYzgGxi0jfsExfB3mxjiXTh5E7',
      originalTimestamp: '2023-03-04T19:50:12.981237576Z',
      receivedAt: '2023-03-04T19:50:24.406Z',
      sentAt: null,
      timestamp: '2023-03-04T19:50:12.981Z',
      traits: {
        email: 'uid_0000joe.202@gmail.com',
        phone: '+905555555555',
        num_link_clicked_l_60_d: 1
      },
      type: 'identify',
      userId: 'uid_0000joe.202',
      writeKey: 'sHP5qhkKvj5KpBhCJKKIyt8L1zcJ9FSH'
    })

    const responses = await testDestination.testAction('insiderAudiences', { event })
    expect(responses[0].status).toBe(200)
  })

  it('should insert event when computation class is trait and type is track', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      context: {
        library: {
          name: 'unknown',
          version: 'unknown'
        },
        personas: {
          computation_class: 'trait',
          computation_id: 'tra_2FLcZsMQOSNGZJK4FlmP6o9VN7V',
          computation_key: 'num_link_clicked_l_60_d',
          namespace: 'spa_6W89qwt3f42uPup2nNpZnc',
          space_id: 'spa_6W89qwt3f42uPup2nNpZnc'
        }
      },
      integrations: {
        All: false,
        Appboy: true,
        Warehouses: {
          all: false
        }
      },
      event: 'Test Event',
      messageId: 'personas_2MYzgGxi0jfsExfB3mxjiXTh5E7',
      originalTimestamp: '2023-03-04T19:50:12.981237576Z',
      receivedAt: '2023-03-04T19:50:24.406Z',
      sentAt: null,
      timestamp: '2023-03-04T19:50:12.981Z',
      traits: {
        email: 'uid_0000joe.202@gmail.com',
        phone: '+905555555555',
        num_link_clicked_l_60_d: 1
      },
      type: 'track',
      userId: 'uid_0000joe.202',
      writeKey: 'sHP5qhkKvj5KpBhCJKKIyt8L1zcJ9FSH'
    })

    const responses = await testDestination.testAction('insiderAudiences', { event })
    expect(responses[0].status).toBe(200)
  })

  it('should throw error when type is not track or identity', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      context: {
        library: {
          name: 'unknown',
          version: 'unknown'
        },
        personas: {
          computation_class: 'trait',
          computation_id: 'tra_2FLcZsMQOSNGZJK4FlmP6o9VN7V',
          computation_key: 'num_link_clicked_l_60_d',
          namespace: 'spa_6W89qwt3f42uPup2nNpZnc',
          space_id: 'spa_6W89qwt3f42uPup2nNpZnc'
        }
      },
      integrations: {
        All: false,
        Appboy: true,
        Warehouses: {
          all: false
        }
      },
      event: 'Test Event',
      messageId: 'personas_2MYzgGxi0jfsExfB3mxjiXTh5E7',
      originalTimestamp: '2023-03-04T19:50:12.981237576Z',
      receivedAt: '2023-03-04T19:50:24.406Z',
      sentAt: null,
      timestamp: '2023-03-04T19:50:12.981Z',
      traits: {
        email: 'uid_0000joe.202@gmail.com',
        phone: '+905555555555',
        num_link_clicked_l_60_d: 1
      },
      type: 'screen',
      userId: 'uid_0000joe.202',
      writeKey: 'sHP5qhkKvj5KpBhCJKKIyt8L1zcJ9FSH'
    })

    await expect(testDestination.testAction('insiderAudiences', { event })).rejects.toThrowError(
      'This integration only supports identify and track calls from Segment Engage'
    )
  })
})
