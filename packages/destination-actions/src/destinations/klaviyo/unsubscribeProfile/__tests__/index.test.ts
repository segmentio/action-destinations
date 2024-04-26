import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { PayloadValidationError } from '@segment/actions-core'
import nock from 'nock'
const testDestination = createTestIntegration(Destination)

const apiKey = 'fake-api-key'
export const settings = {
  api_key: apiKey
}

describe('Unsubscribe Profile', () => {
  it('should throw error if no email or phone_number is provided', async () => {
    const event = createTestEvent({
      type: 'track'
    })
    await expect(
      testDestination.testAction('unsubscribeProfile', { event, settings, useDefaultMappings: true })
    ).rejects.toThrowError(PayloadValidationError)
  })

  it('formats the correct request body when list id is empty', async () => {
    const payload = {
      email: 'segment@email.com',
      phone_number: '+17067675219',
      list_id: '',
      timestamp: '2024-04-01T18:37:06.558Z'
    }
    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: payload.email,
                  phone_number: payload.phone_number
                }
              }
            ]
          }
        }
      }
    }
    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-delete-jobs', requestBody).reply(200, {})
    const event = createTestEvent({
      type: 'track',
      timestamp: payload.timestamp,
      context: {
        traits: {
          email: payload.email,
          phone_number: payload.phone_number
        }
      }
    })
    const mapping = {
      list_id: payload.list_id,
      consented_at: {
        '@path': '$.timestamp'
      },
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }
    await expect(
      testDestination.testAction('unsubscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('formats the correct request body when list id is populated', async () => {
    const payload = {
      email: 'segment@email.com',
      phone_number: '+17067675219',
      list_id: '1234',
      timestamp: '2024-04-01T18:37:06.558Z'
    }
    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: payload.email,
                  phone_number: payload.phone_number
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: payload.list_id
            }
          }
        }
      }
    }
    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-delete-jobs', requestBody).reply(200, {})
    const event = createTestEvent({
      type: 'track',
      timestamp: payload.timestamp,
      context: {
        traits: {
          email: payload.email,
          phone_number: payload.phone_number
        }
      }
    })
    const mapping = {
      list_id: payload.list_id,
      consented_at: {
        '@path': '$.timestamp'
      },
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }
    await expect(
      testDestination.testAction('unsubscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('formats the correct request body when only email is provided', async () => {
    const payload = {
      email: 'segment@email.com',
      phone_number: '',
      list_id: '',
      timestamp: '2024-04-01T18:37:06.558Z'
    }
    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: payload.email
                }
              }
            ]
          }
        }
      }
    }
    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-delete-jobs', requestBody).reply(200, {})
    const event = createTestEvent({
      type: 'track',
      timestamp: payload.timestamp,
      context: {
        traits: {
          email: payload.email,
          phone_number: payload.phone_number
        }
      }
    })
    const mapping = {
      list_id: payload.list_id,
      consented_at: {
        '@path': '$.timestamp'
      },
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }
    await expect(
      testDestination.testAction('unsubscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('formats the correct request body when only phone_number is provided', async () => {
    const payload = {
      email: '',
      phone_number: '+17067675463',
      list_id: '',
      timestamp: '2024-04-01T18:37:06.558Z'
    }
    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  phone_number: payload.phone_number
                }
              }
            ]
          }
        }
      }
    }
    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-delete-jobs', requestBody).reply(200, {})
    const event = createTestEvent({
      type: 'track',
      timestamp: payload.timestamp,
      context: {
        traits: {
          email: payload.email,
          phone_number: payload.phone_number
        }
      }
    })
    const mapping = {
      list_id: payload.list_id,
      consented_at: {
        '@path': '$.timestamp'
      },
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }
    await expect(
      testDestination.testAction('unsubscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('should throw an error when performBatch exceeds 10 batches', async () => {
    const mapping = {
      list_id: {
        '@path': '$.context.traits.list_id'
      },
      consented_at: {
        '@path': '$.timestamp'
      },
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }
    const events = [
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test@email.com',
            list_id: '1'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            phone_number: '+17067675129',
            list_id: '2'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test2@email.com',
            phone_number: '+17067665437',
            list_id: '3'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test3@email.com',
            list_id: '4'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test4@email.com',
            list_id: '5'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test5@email.com',
            list_id: '6'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test6@email.com',
            list_id: '7'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test7@email.com',
            list_id: '8'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test8@email.com',
            list_id: '9'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test9@email.com',
            list_id: '10'
          }
        }
      })
    ]

    await expect(
      testDestination.testBatchAction('unsubscribeProfile', { events, settings, mapping })
    ).rejects.toThrowError(PayloadValidationError)
  })

  it('formats the correct request body for batch requests with 1 list_id', async () => {
    const mapping = {
      list_id: '1234',
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }
    const events = [
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test@email.com'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            phone_number: '+17067675129'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test2@email.com',
            phone_number: '+17067665437'
          }
        }
      })
    ]
    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: 'test@email.com'
                }
              },
              {
                type: 'profile',
                attributes: {
                  phone_number: '+17067675129'
                }
              },
              {
                type: 'profile',
                attributes: {
                  email: 'test2@email.com',
                  phone_number: '+17067665437'
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: '1234'
            }
          }
        }
      }
    }
    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-delete-jobs', requestBody).reply(200, {})
    await expect(
      testDestination.testBatchAction('unsubscribeProfile', { events, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('formats the correct request body for multiple batch requests', async () => {
    const mapping = {
      list_id: {
        '@path': '$.context.traits.list_id'
      },
      consented_at: {
        '@path': '$.timestamp'
      },
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }
    const events = [
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test@email.com',
            list_id: '1'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            phone_number: '+17067675129',
            list_id: '2'
          }
        }
      }),
      createTestEvent({
        type: 'track',
        timestamp: '2024-04-24T12:06:41.897Z',
        context: {
          traits: {
            email: 'test2@email.com'
          }
        }
      })
    ]
    const requestBody1 = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: 'test@email.com'
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: '1'
            }
          }
        }
      }
    }
    const requestBody2 = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  phone_number: '+17067675129'
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: '2'
            }
          }
        }
      }
    }

    const requestBody3 = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: 'test2@email.com'
                }
              }
            ]
          }
        }
      }
    }

    const scope = nock('https://a.klaviyo.com/api')

    // Expectation for the first request
    scope.post('/profile-subscription-bulk-delete-jobs', requestBody1).reply(200, {})

    // Expectation for the second request
    scope.post('/profile-subscription-bulk-delete-jobs', requestBody2).reply(200, {})

    // Expectation for the second request
    scope.post('/profile-subscription-bulk-delete-jobs', requestBody3).reply(200, {})

    // Invoke the function under test
    await expect(
      testDestination.testBatchAction('unsubscribeProfile', { events, mapping, settings })
    ).resolves.not.toThrowError()

    // Verify that the expected requests were made
    expect(scope.isDone()).toBe(true)
  })
})
