import { processPayload } from '../../insider-helpers'
import { Payload } from '../generated-types'

describe('processPayload', () => {
  const mockRequest = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should handle trait with track', async () => {
    const payload: Payload[] = [
      {
        event_type: 'track',
        event_name: 'segment event',
        segment_computation_action: 'trait',
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
            events: [
              {
                event_name: 'segment_event',
                timestamp: '2021-05-20T12:00:00.000Z',
                event_params: {
                  custom: {
                    segment_engage_name: 'example_audience'
                  }
                }
              }
            ]
          }
        ]
      }
    })
  })

  it('should handle trait with identify', async () => {
    const payload: Payload[] = [
      {
        custom_audience_name: 'num_link_clicked_l_60_d',
        segment_computation_action: 'trait',
        email: 'example@example.com',
        phone: '1234567890',
        anonymous_id: '123',
        traits_or_props: {
          email: 'example@example.com',
          num_link_clicked_l_60_d: 1
        },
        user_id: '123',
        event_type: 'identify',
        timestamp: '2023-03-04T19:50:12.981Z'
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
              email: 'example@example.com',
              phone_number: '1234567890',
              custom: {
                segment_anonymous_id: '123'
              }
            },
            attributes: {
              custom: {
                segment_io_num_link_clicked_l_60_d: 1
              }
            }
          }
        ]
      }
    })
  })

  it('should handle trait with track', async () => {
    const payload: Payload[] = [
      {
        custom_audience_name: 'example_audience',
        segment_computation_action: 'trait',
        email: 'example@example.com',
        phone: '1234567890',
        traits_or_props: {
          email: 'example@example.com',
          phone: '1234567890',
          num_link_clicked_l_60_d: 1
        },
        event_type: 'track',
        event_name: 'Segment Event',
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
              email: 'example@example.com',
              phone_number: '1234567890'
            },
            events: [
              {
                event_name: 'segment_event',
                timestamp: '2021-05-20T12:00:00.000Z',
                event_params: {
                  custom: {
                    segment_engage_name: 'example_audience'
                  }
                }
              }
            ]
          }
        ]
      }
    })
  })

  it('should handle audience with identify', async () => {
    const payload: Payload[] = [
      {
        custom_audience_name: 'demo_squarkai',
        segment_computation_action: 'audience',
        email: 'example@example.com',
        traits_or_props: {
          demo_squarkai: true,
          email: 'example@example.com'
        },
        user_id: '123',
        event_type: 'identify',
        timestamp: '2023-03-06T14:57:04.135Z'
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
                segment_audience_name: ['demo_squarkai']
              }
            }
          }
        ]
      }
    })
  })

  it('should handle audience with track', async () => {
    const payload: Payload[] = [
      {
        custom_audience_name: 'demo_squarkai',
        segment_computation_action: 'audience',
        email: 'example@example.com',
        event_name: 'Segment Event',
        traits_or_props: {
          demo_squarkai: true,
          email: 'example@example.com'
        },
        user_id: '123',
        event_type: 'track',
        timestamp: '2023-03-06T14:57:04.135Z'
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
            events: [
              {
                event_name: 'segment_event',
                event_params: {
                  custom: {
                    segment_engage_name: 'demo_squarkai'
                  }
                },
                timestamp: '2023-03-06T14:57:04.135Z'
              }
            ]
          }
        ]
      }
    })
  })

  it('should handle audience identify with false value', async () => {
    const payload: Payload[] = [
      {
        event_type: 'identify',
        segment_computation_action: 'audience',
        custom_audience_name: 'example_audience',
        traits_or_props: {
          example_audience: false,
          email: 'example@example.com'
        },
        user_id: '123',
        email: 'example@example.com',
        timestamp: '2021-05-20T12:00:00.000Z'
      }
    ]

    await processPayload(mockRequest, payload)
    expect(mockRequest).toHaveBeenCalledWith('https://unification.useinsider.com/api/user/v1/attribute/delete', {
      method: 'POST',
      json: {
        users: [
          {
            identifiers: {
              uuid: '123',
              email: 'example@example.com'
            },
            custom: {
              partial: {
                segment_audience_name: ['example_audience']
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
