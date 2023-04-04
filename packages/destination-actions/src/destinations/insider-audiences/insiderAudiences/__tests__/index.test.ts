import { processPayload } from '../../insider-helpers'
import { Payload } from '../generated-types'

describe('processPayload', () => {
  const mockRequest = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should handle computed audiences', async () => {
    const payload: Payload[] = [
      {
        event_type: 'identify',
        segment_computation_action: 'audience',
        custom_audience_name: 'example_audience',
        traits_or_props: {
          example_audience: true,
          email: 'example@example.com'
        },
        user_id: '123',
        email: 'example@example.com',
        timestamp: '2021-05-20T12:00:00.000Z'
      }
    ]
    await processPayload(mockRequest, payload)
    expect(mockRequest).toHaveBeenCalledWith('https://unification.useinsider.com/api/user/v1/upsert', {
      method: 'POST',
      json: {
        users: [
          {
            identifiers: {
              uuid: '123',
              email: 'example@example.com'
            },
            attributes: {
              custom: {
                segment_audience_name: ['example_audience']
              }
            }
          }
        ]
      }
    })
  })

  it('should handle computed traits', async () => {
    const payload: Payload[] = [
      {
        event_type: 'identify',
        segment_computation_action: 'trait',
        custom_audience_name: 'example_trait',
        traits_or_props: {
          example_trait: 'example_value',
          email: 'example@example.com'
        },
        user_id: '123',
        email: 'example@example.com',
        timestamp: '2021-05-20T12:00:00.000Z'
      }
    ]
    await processPayload(mockRequest, payload)
    expect(mockRequest).toHaveBeenCalledWith('https://unification.useinsider.com/api/user/v1/upsert', {
      method: 'POST',
      json: {
        users: [
          {
            identifiers: {
              uuid: '123',
              email: 'example@example.com'
            },
            attributes: {
              custom: {
                segment_io_example_trait: 'example_value'
              }
            }
          }
        ]
      }
    })
  })

  it('should throw error when type is not audience or computed trait and not track or identify', async () => {
    const payload: Payload[] = [
      {
        event_type: 'identify',
        segment_computation_action: 'invalid',
        custom_audience_name: 'example_trait',
        traits_or_props: {
          example_trait: 'example_value',
          email: 'example@example.com'
        },
        user_id: '123',
        email: 'example@example.com',
        timestamp: '2021-05-20T12:00:00.000Z'
      }
    ]
    await expect(processPayload(mockRequest, payload)).rejects.toThrowError(
      'API call must be an Audience or Computed Trait track() or identify() call'
    )

    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('should throw error when type is audience and event type is not identify or track', async () => {
    const payload: Payload[] = [
      {
        event_type: 'invalid',
        segment_computation_action: 'audience',
        custom_audience_name: 'invalid_event_test',
        traits_or_props: {
          example_trait: 'example_value',
          email: 'example@example.com'
        },
        user_id: '123',
        email: 'example@example.com',
        timestamp: '2021-05-20T12:00:00.000Z'
      }
    ]

    await expect(processPayload(mockRequest, payload)).rejects.toThrowError(
      'API call must be a track() or identify() call'
    )

    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('should throw error when type is trait and event type is not identify or track', async () => {
    const payload: Payload[] = [
      {
        event_type: 'invalid',
        segment_computation_action: 'trait',
        custom_audience_name: 'invalid_event_test',
        traits_or_props: {
          example_trait: 'example_value',
          email: 'example@example.com'
        },
        user_id: '123',
        email: 'example@example.com',
        timestamp: '2021-05-20T12:00:00.000Z'
      }
    ]

    await expect(processPayload(mockRequest, payload)).rejects.toThrowError(
      'API call must be a track() or identify() call'
    )

    expect(mockRequest).not.toHaveBeenCalled()
  })
})
