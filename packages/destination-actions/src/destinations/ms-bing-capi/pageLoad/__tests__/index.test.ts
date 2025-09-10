import action from '../index' // adjust relative path
import { API_URL } from '../../constants'
import { processHashing } from '../../../../lib/hashing-utils'
import { v4 as uuidv4 } from '@lukeed/uuid'

jest.mock('../../../../lib/hashing-utils', () => ({
  processHashing: jest.fn()
}))
jest.mock('@lukeed/uuid', () => ({
  v4: jest.fn()
}))

const mockRequest = jest.fn()

describe('Microsoft Bing CAPI - Page Load action', () => {
  const settings = { UetTag: 'test-uet', ApiToken: 'test-api-token' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('injects anonymousId into data.userData when missing', async () => {
    ;(uuidv4 as jest.Mock).mockReturnValue('anon-xyz')

    await action.perform(mockRequest, {
      settings,
      payload: {
        data: { eventName: 'Page Load' }
      } as any
    })

    expect(mockRequest).toHaveBeenCalledWith(
      `${API_URL}test-uet/events`,
      expect.objectContaining({
        method: 'post',
        json: {
          data: [
            {
              eventName: 'Page Load',
              userData: { anonymousId: 'anon-xyz' }
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
        data: { eventName: 'Page Load' },
        userData: { em: '  TEST@Example.Com ' }
      } as any
    })

    expect(processHashing).toHaveBeenCalledWith('  TEST@Example.Com ', 'sha256', 'hex', expect.any(Function))
    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: {
          data: [
            expect.objectContaining({
              userData: { em: 'hashed-email' }
            })
          ]
        }
      })
    )
  })

  it('hashes phone (ph) correctly with digits only', async () => {
    ;(processHashing as jest.Mock).mockReturnValue('hashed-phone')

    await action.perform(mockRequest, {
      settings,
      payload: {
        data: { eventName: 'Page Load' },
        userData: { ph: ' +1 (555) 888-9999 ' }
      } as any
    })

    expect(processHashing).toHaveBeenCalledWith(' +1 (555) 888-9999 ', 'sha256', 'hex', expect.any(Function))

    // validate transform callback removes non-digits
    const transform = (processHashing as jest.Mock).mock.calls[0][3]
    expect(transform(' +1 (555) 888-9999 ')).toBe('15558889999')
  })

  it('merges customData into data', async () => {
    ;(uuidv4 as jest.Mock).mockReturnValue('anon-xyz')

    await action.perform(mockRequest, {
      settings,
      payload: {
        data: { eventName: 'Page Load' },
        customData: { pageCategory: 'Home' }
      } as any
    })

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: {
          data: [
            {
              eventName: 'Page Load',
              customData: { pageCategory: 'Home' },
              userData: { anonymousId: 'anon-xyz' }
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
        data: { eventName: 'Page Load' },
        customData: { ref: 'ad-campaign-1' },
        userData: { em: 'sample@example.com' }
      } as any
    })

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: {
          data: [
            {
              eventName: 'Page Load',
              customData: { ref: 'ad-campaign-1' },
              userData: { em: 'hashed-email' }
            }
          ]
        }
      })
    )
  })

  it('builds correct API URL using UetTag', async () => {
    await action.perform(mockRequest, {
      settings: { UetTag: 'XYZ123' },
      payload: {
        data: { eventName: 'Page Load' }
      } as any
    })

    expect(mockRequest).toHaveBeenCalledWith(`${API_URL}XYZ123/events`, expect.any(Object))
  })
})
