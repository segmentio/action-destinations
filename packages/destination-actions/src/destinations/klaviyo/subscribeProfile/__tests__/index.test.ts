import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { PayloadValidationError } from '@segment/actions-core'
import nock from 'nock'
const testDestination = createTestIntegration(Destination)

const apiKey = 'fake-api-key'
export const settings = {
  api_key: apiKey
}

describe('Subscribe Profile', () => {
  it('should throw error if no email or phone_number is provided', async () => {
    const event = createTestEvent({
      type: 'track'
    })

    await expect(
      testDestination.testAction('subscribeProfile', { event, settings, useDefaultMappings: true })
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
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Segment Klaviyo (Actions) Destination',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: payload.email,
                  phone_number: payload.phone_number,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: payload.timestamp
                      }
                    },
                    sms: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: payload.timestamp
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      }
    }

    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-create-jobs/', requestBody).reply(200, {})

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
      testDestination.testAction('subscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('formats the correct request body when list id is populated', async () => {
    const payload = {
      email: 'segment@email.com',
      phone_number: '+17067675219',
      list_id: '12345',
      timestamp: '2024-04-01T18:37:06.558Z'
    }

    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Segment Klaviyo (Actions) Destination',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: payload.email,
                  phone_number: payload.phone_number,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: payload.timestamp
                      }
                    },
                    sms: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: payload.timestamp
                      }
                    }
                  }
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

    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-create-jobs/', requestBody).reply(200, {})

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
      testDestination.testAction('subscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('formats the correct request body when only email is provided', async () => {
    const payload = {
      email: 'segment@email.com',
      list_id: '12345',
      timestamp: '2024-04-01T18:37:06.558Z'
    }

    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Marketing Event',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: payload.email,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: payload.timestamp
                      }
                    }
                  }
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

    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-create-jobs/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: payload.timestamp,
      context: {
        traits: {
          email: payload.email
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
      },
      custom_source: 'Marketing Event'
    }

    await expect(
      testDestination.testAction('subscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('formats the correct request body when only phone number is provided', async () => {
    const payload = {
      phone_number: '+17067675219',
      list_id: '12345',
      timestamp: '2024-04-01T18:37:06.558Z'
    }

    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Segment Klaviyo (Actions) Destination',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  phone_number: payload.phone_number,
                  subscriptions: {
                    sms: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: payload.timestamp
                      }
                    }
                  }
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

    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-create-jobs/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: payload.timestamp,
      context: {
        traits: {
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
      testDestination.testAction('subscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('formats the correct request body for batch requests', async () => {
    const mapping = {
      list_id: '1234',
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
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Segment Klaviyo (Actions) Destination',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: 'test@email.com',
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: '2024-04-24T12:06:41.897Z'
                      }
                    }
                  }
                }
              },
              {
                type: 'profile',
                attributes: {
                  phone_number: '+17067675129',
                  subscriptions: {
                    sms: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: '2024-04-24T12:06:41.897Z'
                      }
                    }
                  }
                }
              },
              {
                type: 'profile',
                attributes: {
                  email: 'test2@email.com',
                  phone_number: '+17067665437',
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: '2024-04-24T12:06:41.897Z'
                      }
                    },
                    sms: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: '2024-04-24T12:06:41.897Z'
                      }
                    }
                  }
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

    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-create-jobs/', requestBody).reply(200, {})

    await expect(
      testDestination.testBatchAction('subscribeProfile', { events, mapping, settings })
    ).resolves.not.toThrowError()
  })
})
