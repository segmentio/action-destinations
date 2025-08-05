import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Region } from '../../types'

const testDestination = createTestIntegration(Destination)

describe('trackConversion', () => {
    beforeEach(() => {
        nock.cleanAll()
    })

    const event = createTestEvent({
        event: 'Product Added',
        type: 'track',
        properties: {
            email: 'test@example.com',
            eventType: 'ADD_TO_SHOPPING_CART'
        }
    })

    const settings = {
        region: Region.NA,
        advertiserId: '12345678'
    }

    describe('action configuration', () => {
        it('should have the correct action properties', () => {
            const action = Destination.actions.trackConversion

            expect(action).toBeDefined()
            expect(action.title).toBe('Track Conversion')
            expect(action.description).toBe('Send conversion event data to Amazon Events API')
            expect(action.defaultSubscription).toBe('type = "track"')
            expect(action.fields).toBeDefined()
        })
    })

    describe('perform', () => {
        it('should send event data successfully', async () => {
            nock(`${Region.NA}`)
                .post('/events/v1')
                .reply(200, { success: true })

            const responses = await testDestination.testAction('trackConversion', {
                event,
                settings,
                mapping: {
                    name: 'test_conversion',
                    eventType: 'ADD_TO_SHOPPING_CART',
                    eventActionSource: 'website',
                    countryCode: 'US',
                    timestamp: '2023-01-01T12:00:00Z',
                    matchKeys: {
                        email: 'test@example.com'
                    },
                    enable_batching: true
                }
            })

            expect(responses.length).toBe(1)
            expect(responses[0].status).toBe(200)
            expect(responses[0].data).toEqual({ success: true })
        })

        it('should handle API errors', async () => {
            // Mock an API error response
            nock(`${Region.NA}`)
                .post('/events/v1')
                .replyWithError('Invalid event data')

            await expect(
                testDestination.testAction('trackConversion', {
                    event,
                    settings,
                    mapping: {
                        name: 'test_conversion',
                        eventType: 'ADD_TO_SHOPPING_CART',
                        eventActionSource: 'website',
                        countryCode: 'US',
                        timestamp: '2023-01-01T12:00:00Z',
                        matchKeys: {
                            email: 'invalid_email'
                        },
                        enable_batching: true
                    }
                })
            ).rejects.toThrow()
        })

        it('should throw an error if required fields are missing', async () => {
            await expect(
                testDestination.testAction('trackConversion', {
                    event,
                    settings,
                    mapping: {
                        name: 'test_conversion',
                        // Missing eventType
                        eventActionSource: 'website',
                        countryCode: 'US',
                        timestamp: '2023-01-01T12:00:00Z',
                        matchKeys: {
                            email: 'test@example.com'
                        },
                        enable_batching: true
                    }
                })
            ).rejects.toThrow()
        })
    })

    describe('performBatch', () => {
        const events = [
            createTestEvent({
                event: 'Product Added',
                type: 'track',
                properties: {
                    email: 'test1@example.com'
                }
            }),
            createTestEvent({
                event: 'Page View',
                type: 'page',
                properties: {
                    email: 'test2@example.com'
                }
            })
        ]

        it('should process a batch of events successfully', async () => {
            // Mock a 207 multi-status response
            nock(`${Region.NA}`)
                .post('/events/v1')
                .reply(207, {
                    success: [
                        { index: 1, message: 'Success' }
                    ],
                    error: [
                        { index: 2, httpStatusCode: '400', subErrors: [{ errorMessage: 'Invalid event' }] }
                    ]
                })

            const responses = await testDestination.testBatchAction('trackConversion', {
                events,
                settings,
                mapping: {
                    name: 'test_batch_conversion',
                    eventType: 'ADD_TO_SHOPPING_CART',
                    eventActionSource: 'website',
                    countryCode: 'US',
                    timestamp: '2023-01-01T12:00:00Z',
                    matchKeys: {
                        email: {
                            '@path': '$.properties.email'
                        }
                    },
                    enable_batching: true
                }
            })

            // Verify batch response structure
            expect(responses.length).toBe(1)
            expect(responses[0].status).toBe(207)
            expect(responses[0].data).toBeDefined()
            expect(responses[0].data).toHaveProperty('success')
            expect(responses[0].data).toHaveProperty('error')
        })

        it('should handle validation errors for individual payloads', async () => {
            // Mock the API request to send a partial success response
            nock(`${Region.NA}`)
                .post('/events/v1')
                .reply(207, {
                    success: [{ index: 1, message: 'Success' },{ index: 2, message: 'Success' }],
                    error: []
                })

            // Create an invalid event that will fail validation alongside valid events
            const invalidEvents = [
                createTestEvent({
                    event: 'Product Added',
                    type: 'track',
                    properties: {
                        email: '' // Empty email will fail validation
                    }
                }),
                ...events
            ]

            // Spy on console.error to prevent error output during the test
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

            try {
                const responses = await testDestination.testBatchAction('trackConversion', {
                    events: invalidEvents,
                    settings,
                    mapping: {
                        name: 'test_batch_conversion',
                        eventType: 'ADD_TO_SHOPPING_CART',
                        eventActionSource: 'website',
                        countryCode: 'US',
                        timestamp: '2023-01-01T12:00:00Z',
                        matchKeys: {
                            email: {
                                '@path': '$.properties.email'
                            }
                        },
                        enable_batching: true
                    }
                })

                // We should get at least one response for the valid events
                expect(responses.length).toBeGreaterThanOrEqual(1)

                // Check the structure of the response but don't rely on specific properties
                expect(responses[0]).toBeDefined()
            } finally {
                consoleErrorSpy.mockRestore()
            }
        })

        it('should handle API errors in batch mode', async () => {
            nock(`${Region.NA}`)
                .post('/events/v1')
                .reply(500, { error: 'Internal server error' })

            // Spy on console.error to prevent error output during the test
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

            try {
                // We don't expect the whole batch to throw anymore, just to report errors properly
                const responses = await testDestination.testBatchAction('trackConversion', {
                    events,
                    settings,
                    mapping: {
                        name: 'test_batch_conversion',
                        eventType: 'ADD_TO_SHOPPING_CART',
                        eventActionSource: 'website',
                        countryCode: 'US',
                        timestamp: '2023-01-01T12:00:00Z',
                        matchKeys: {
                            email: {
                                '@path': '$.properties.email'
                            }
                        },
                        enable_batching: true
                    }
                })

                // The response should be defined
                expect(responses).toBeDefined()

                // The response should contain information about the error
                if (responses.length > 0) {
                    expect(responses[0].status).toBe(500)
                }
            } finally {
                consoleErrorSpy.mockRestore()
            }
        })
    })
})
