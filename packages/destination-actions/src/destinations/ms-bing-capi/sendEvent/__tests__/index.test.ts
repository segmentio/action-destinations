import action from '../index' // adjust path
import { API_URL } from '../constants'
import { processHashing } from '../../../../lib/hashing-utils'
import { v4 as uuidv4 } from '@lukeed/uuid'

jest.mock('../../../../lib/hashing-utils', () => ({
  processHashing: jest.fn()
}))
jest.mock('@lukeed/uuid', () => ({
  v4: jest.fn()
}))

const mockRequest = jest.fn()

describe('Microsoft Bing CAPI - Send Event action', () => {
  const settings = { UetTag: 'test-uet', ApiToken: 'test-api-token' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('injects anonymousId when userData is missing', async () => {
    ;(uuidv4 as jest.Mock).mockReturnValue('anon-123')

    await action.perform(mockRequest, {
      settings,
      payload: {
        data: { eventName: 'Page View' }
      } as any
    })

    expect(mockRequest).toHaveBeenCalledWith(
      `${API_URL}${settings.UetTag}/events`,
      expect.objectContaining({
        method: 'post',
        json: {
          data: [
            {
              eventName: 'Page View',
              userData: { anonymousId: 'anon-123' }
            }
          ]
        }
      })
    )
  })

  it('hashes email (em) correctly', async () => {
    ;(processHashing as jest.Mock).mockReturnValue('hashed-email')

    await action.perform(mockRequest, {
      settings,
      payload: {
        data: { eventName: 'Signup' },
        userData: { em: '  USER@Example.Com ' }
      } as any
    })

    expect(processHashing).toHaveBeenCalledWith('  USER@Example.Com ', 'sha256', 'hex', expect.any(Function))
    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: {
          data: [
            {
              eventName: 'Signup',
              userData: { em: 'hashed-email' }
            }
          ]
        }
      })
    )
  })

  it('hashes phone (ph) correctly with only digits', async () => {
    ;(processHashing as jest.Mock).mockReturnValue('hashed-phone')

    await action.perform(mockRequest, {
      settings,
      payload: {
        data: { eventName: 'Purchase' },
        userData: { ph: ' +1 (555) 123-4567 ' }
      } as any
    })

    expect(processHashing).toHaveBeenCalledWith(' +1 (555) 123-4567 ', 'sha256', 'hex', expect.any(Function))
    // check transformation function (digits only)
    const transform = (processHashing as jest.Mock).mock.calls[0][3]
    expect(transform(' +1 (555) 123-4567 ')).toBe('15551234567')
  })

  it('merges customData into data', async () => {
    ;(uuidv4 as jest.Mock).mockReturnValue('anon-123')

    await action.perform(mockRequest, {
      settings,
      payload: {
        data: { eventName: 'Add To Cart' },
        customData: { productId: 'P123' }
      } as any
    })

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: {
          data: [
            {
              eventName: 'Add To Cart',
              customData: { productId: 'P123' },
              userData: { anonymousId: 'anon-123' }
            }
          ]
        }
      })
    )
  })

  it('merges both customData and userData', async () => {
    ;(processHashing as jest.Mock).mockReturnValue('hashed-email')

    await action.perform(mockRequest, {
      settings,
      payload: {
        data: { eventName: 'Checkout' },
        customData: { orderId: 'O999' },
        userData: { em: 'abc@example.com' }
      } as any
    })

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: {
          data: [
            {
              eventName: 'Checkout',
              customData: { orderId: 'O999' },
              userData: { em: 'hashed-email' }
            }
          ]
        }
      })
    )
  })
})
