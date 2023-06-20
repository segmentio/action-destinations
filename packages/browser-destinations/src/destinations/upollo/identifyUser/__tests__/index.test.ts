import { Analytics, Context } from '@segment/analytics-next'

import identify from '..'
import { UpolloClient } from '../../types'
import { Payload } from '../generated-types'

it('should identify', async () => {
  const client = {
    track: jest.fn()
  } as any as UpolloClient

  const context = new Context({
    type: 'identify',
    event: 'Signed Up'
  })

  await identify.perform(client as any as UpolloClient, {
    settings: { apiKey: '123' },
    analytics: jest.fn() as any as Analytics,
    context: context,
    payload: {
      user_id: 'u1',
      email: 'foo@bar.com',
      phone: '+611231234',
      name: 'Mr Foo',
      avatar_image_url: 'http://smile',
      custom_traits: {
        DOB: '1990-01-01',
        Plan: 'Bronze',
        session: {
          // session is excluded because its not a string
          count: 1
        }
      }
    } as Payload
  })

  expect(client.track).toHaveBeenCalledWith({
    userId: 'u1',
    userEmail: 'foo@bar.com',
    userPhone: '+611231234',
    userName: 'Mr Foo',
    userImage: 'http://smile',
    customerSuppliedValues: { DOB: '1990-01-01', Plan: 'Bronze' }
  })
})

it('should combine first and last if no full name is provided', async () => {
  const client = {
    track: jest.fn().mockResolvedValue({ emailAnalysis: { company: { name: '' } } })
  } as any as UpolloClient

  const context = new Context({
    type: 'identify',
    event: 'Signed Up'
  })

  await identify.perform(client as any as UpolloClient, {
    settings: { apiKey: '123' },
    analytics: jest.fn() as any as Analytics,
    context: context,
    payload: {
      user_id: 'u1',
      email: 'foo@bar.com',
      phone: '+611231234',
      name: '',
      firstName: 'test',
      lastName: 'test',
      avatar_image_url: 'http://smile',
      custom_traits: {
        DOB: '1990-01-01',
        Plan: 'Bronze',
        session: {
          // session is excluded because its not a string
          count: 1
        }
      }
    } as Payload
  })

  expect(client.track).toHaveBeenCalledWith({
    userId: 'u1',
    userEmail: 'foo@bar.com',
    userPhone: '+611231234',
    userName: 'test test',
    userImage: 'http://smile',
    customerSuppliedValues: { DOB: '1990-01-01', Plan: 'Bronze' }
  })
})

it('should have an empty string for name if no name is provided', async () => {
  const client = {
    track: jest.fn().mockResolvedValue({ emailAnalysis: { company: { name: '' } } })
  } as any as UpolloClient

  const context = new Context({
    type: 'identify',
    event: 'Signed Up'
  })

  await identify.perform(client as any as UpolloClient, {
    settings: { apiKey: '123' },
    analytics: jest.fn() as any as Analytics,
    context: context,
    payload: {
      user_id: 'u1',
      email: 'foo@bar.com',
      phone: '+611231234',
      name: '',
      firstName: '',
      lastName: '',
      avatar_image_url: 'http://smile',
      custom_traits: {
        DOB: '1990-01-01',
        Plan: 'Bronze',
        session: {
          // session is excluded because its not a string
          count: 1
        }
      }
    } as Payload
  })

  expect(client.track).toHaveBeenCalledWith({
    userId: 'u1',
    userEmail: 'foo@bar.com',
    userPhone: '+611231234',
    userName: undefined,
    userImage: 'http://smile',
    customerSuppliedValues: { DOB: '1990-01-01', Plan: 'Bronze' }
  })
})
