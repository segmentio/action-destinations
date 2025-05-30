import nock from 'nock'
import {
    hasStringValue,
    validateConsent,
    normalize,
    normalizeEmail,
    normalizePhone,
    normalizeStandard,
    normalizePostal,
    smartHash,
    sendEventsRequest,
    validateCountryCode,
    handleBatchResponse,
    prepareEventData
} from '../utils'
import { RequestClient, MultiStatusResponse } from '@segment/actions-core'
import { Region, EventData, ConversionTypeV2 } from '../../types'

describe('trackConversion utils', () => {
    describe('hasStringValue', () => {
        it('should return true for non-empty strings', () => {
            expect(hasStringValue('test')).toBe(true)
            expect(hasStringValue('  test  ')).toBe(true)
            expect(hasStringValue('0')).toBe(true)
        })

        it('should return false for empty strings', () => {
            expect(hasStringValue('')).toBe(false)
            expect(hasStringValue('   ')).toBe(false)
        })

        it('should return false for null or undefined', () => {
            expect(hasStringValue(null)).toBe(false)
            expect(hasStringValue(undefined)).toBe(false)
        })
    })

    describe('validateConsent', () => {
        it('should return undefined when no consent is provided', () => {
            expect(validateConsent({}, Region.NA)).toBeUndefined()
        })

        it('should throw an error when no consent is provided for EU region', () => {
            expect(() => validateConsent({}, Region.EU)).toThrow('At least one type of consent')
        })

        it('should include geographic consent when ipAddress is provided', () => {
            const consent = validateConsent({ ipAddress: '1.2.3.4' }, Region.NA)
            expect(consent).toBeDefined()
            expect(consent?.geo?.ipAddress).toBe('1.2.3.4')
        })

        it('should include Amazon consent when both parameters are provided', () => {
            const consent = validateConsent({
                amznAdStorage: 'GRANTED',
                amznUserData: 'DENIED'
            }, Region.NA)

            expect(consent).toBeDefined()
            expect(consent?.amazonConsent).toEqual({
                amznAdStorage: 'GRANTED',
                amznUserData: 'DENIED'
            })
        })

        it('should include TCF consent when tcf string is provided', () => {
            const tcfString = 'TCF-CONSENT-STRING'
            const consent = validateConsent({ tcf: tcfString }, Region.NA)
            expect(consent).toBeDefined()
            expect(consent?.tcf).toBe(tcfString)
        })

        it('should include GPP consent when gpp string is provided', () => {
            const gppString = 'GPP-CONSENT-STRING'
            const consent = validateConsent({ gpp: gppString }, Region.NA)
            expect(consent).toBeDefined()
            expect(consent?.gpp).toBe(gppString)
        })

        it('should include multiple consent types when provided', () => {
            const consent = validateConsent({
                ipAddress: '1.2.3.4',
                amznAdStorage: 'GRANTED',
                amznUserData: 'GRANTED',
                tcf: 'TCF-STRING',
                gpp: 'GPP-STRING'
            }, Region.NA)

            expect(consent).toBeDefined()
            expect(consent?.geo?.ipAddress).toBe('1.2.3.4')
            expect(consent?.amazonConsent).toEqual({
                amznAdStorage: 'GRANTED',
                amznUserData: 'GRANTED'
            })
            expect(consent?.tcf).toBe('TCF-STRING')
            expect(consent?.gpp).toBe('GPP-STRING')
        })
    })

    describe('normalize functions', () => {
        describe('normalize', () => {
            it('should normalize with provided regex and trim by default', () => {
                const result = normalize('  Test123!@#  ', /[^a-z0-9]/g)
                expect(result).toBe('test123')
            })

            it('should respect trim option when set to false', () => {
                // When we use /[^a-z0-9]/g regex, spaces are already removed by the regex itself
                // Create a regex that doesn't remove spaces for this test
                const result = normalize('  Test123!@#  ', /[^a-z0-9\s]/g, false)
                expect(result).toBe('  test123  ')
            })
        })

        describe('normalizeEmail', () => {
            it('should normalize email addresses according to Amazon requirements', () => {
                expect(normalizeEmail('Test.User@Example.COM')).toBe('test.user@example.com')
                expect(normalizeEmail(' user+tag@domain.co.uk ')).toBe('user+tag@domain.co.uk')
                expect(normalizeEmail('user!#$%^&*@domain.com')).toBe('user@domain.com')
            })
        })

        describe('normalizePhone', () => {
            it('should remove all non-digit characters from phone numbers', () => {
                expect(normalizePhone('+1 (555) 123-4567')).toBe('15551234567')
                expect(normalizePhone('555.123.4567')).toBe('5551234567')
                expect(normalizePhone(' 555-123-4567 ext. 123')).toBe('5551234567123')
            })
        })

        describe('normalizeStandard', () => {
            it('should remove all non-alphanumeric characters and lowercase', () => {
                expect(normalizeStandard('John Doe')).toBe('johndoe')
                expect(normalizeStandard('123 Main St, Apt #4')).toBe('123mainstapt4')
                expect(normalizeStandard('San Francisco, CA')).toBe('sanfranciscoca')
            })
        })

        describe('normalizePostal', () => {
            it('should remove whitespace from postal codes', () => {
                expect(normalizePostal('90210')).toBe('90210')
                expect(normalizePostal('H0H 0H0')).toBe('h0h0h0')
                expect(normalizePostal(' 123 45 ')).toBe('12345')
            })
        })
    })

    describe('smartHash', () => {
        it('should hash values with SHA-256', () => {
            // The hash of 'test@example.com' with SHA-256 is known
            const expectedHash = '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
            expect(smartHash('test@example.com')).toBe(expectedHash)
        })

        it('should normalize values before hashing if normalization function is provided', () => {
            const email = 'Test@Example.com'
            const normalizedEmail = normalizeEmail(email)

            const hashWithoutNormalization = smartHash(email)
            const hashWithNormalization = smartHash(email, normalizeEmail)
            const hashOfNormalized = smartHash(normalizedEmail)

            // Hash with normalization should be different from hash without normalization
            expect(hashWithNormalization).not.toBe(hashWithoutNormalization)

            // Hash with normalization should match hash of pre-normalized value
            expect(hashWithNormalization).toBe(hashOfNormalized)
        })
    })

    describe('sendEventsRequest', () => {
        const settings = { region: Region.NA, advertiserId: '123456789' }
        const eventData: EventData = {
            name: 'test_event',
            eventType: ConversionTypeV2.PAGE_VIEW,
            eventActionSource: 'website',
            countryCode: 'US',
            timestamp: '2023-01-01T12:00:00Z',
        }

        beforeEach(() => {
            nock.cleanAll()
        })

        it('should send a single event correctly', async () => {
            nock(settings.region).post('/events/v1').reply(200, { success: true })

            const mockRequest = jest.fn().mockResolvedValue({
                status: 200,
                data: { success: true }
            })

            const response = await sendEventsRequest(mockRequest as unknown as RequestClient, settings, eventData)

            expect(response.status).toBe(200)
            expect(response.data).toEqual({ success: true })
            expect(mockRequest).toHaveBeenCalledWith(
                `${settings.region}/events/v1`,
                expect.objectContaining({
                    method: 'POST',
                    json: {
                        eventData: [eventData],
                        ingestionMethod: 'SERVER_TO_SERVER'
                    },
                    headers: expect.objectContaining({
                        'Amazon-Ads-AccountId': settings.advertiserId
                    })
                })
            )
        })

        it('should send multiple events as an array', async () => {
            nock(settings.region).post('/events/v1').reply(200, { success: true })

            const mockRequest = jest.fn().mockResolvedValue({
                status: 200,
                data: { success: true }
            })

            const multipleEvents = [
                eventData,
                { ...eventData, name: 'second_event' }
            ]

            const response = await sendEventsRequest(mockRequest as unknown as RequestClient, settings, multipleEvents)

            expect(response.status).toBe(200)
            expect(mockRequest).toHaveBeenCalledWith(
                `${settings.region}/events/v1`,
                expect.objectContaining({
                    json: {
                        eventData: multipleEvents,
                        ingestionMethod: 'SERVER_TO_SERVER'
                    }
                })
            )
        })

        it('should respect throwHttpErrors option', async () => {
            nock(settings.region).post('/events/v1').reply(400, { error: 'Bad Request' })

            const mockRequest = jest.fn().mockResolvedValue({
                status: 400,
                data: { error: 'Bad Request' }
            })

            await sendEventsRequest(mockRequest as unknown as RequestClient, settings, eventData, false)

            expect(mockRequest).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    throwHttpErrors: false
                })
            )

            mockRequest.mockClear()

            // When throwHttpErrors is true, the request should include that option
            try {
                await sendEventsRequest(mockRequest as unknown as RequestClient, settings, eventData, true)
            } catch (error) {
                // Exception might be thrown depending on the mock implementation
            }

            expect(mockRequest).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    throwHttpErrors: true
                })
            )
        })
    })

    describe('validateCountryCode', () => {
        it('should accept valid ISO 3166-1 alpha-2 country codes', () => {
            expect(validateCountryCode('US')).toBe('US')
            expect(validateCountryCode('GB')).toBe('GB')
            expect(validateCountryCode('CA')).toBe('CA')
        })

        it('should extract country code from locale format', () => {
            expect(validateCountryCode('en-US')).toBe('US')
            expect(validateCountryCode('fr-CA')).toBe('CA')
            expect(validateCountryCode('en-GB')).toBe('GB')
        })

        it('should throw an error for invalid country codes', () => {
            expect(() => validateCountryCode('')).toThrow('Country code must be')
            expect(() => validateCountryCode('USA')).toThrow('Country code must be')
            expect(() => validateCountryCode('en_US')).toThrow('Country code must be')
        })
    })

    describe('handleBatchResponse', () => {
        let setSuccessSpy: jest.SpyInstance;
        let setErrorSpy: jest.SpyInstance;

        beforeEach(() => {
            // Setup spies on MultiStatusResponse
            setSuccessSpy = jest.spyOn(MultiStatusResponse.prototype, 'setSuccessResponseAtIndex');
            setErrorSpy = jest.spyOn(MultiStatusResponse.prototype, 'setErrorResponseAtIndex');
        });

        afterEach(() => {
            setSuccessSpy.mockRestore();
            setErrorSpy.mockRestore();
        });

        it('should process 207 multistatus responses correctly', () => {
            const response = {
                status: 207,
                data: {
                    success: [{ index: 1, message: 'Success' }],
                    error: [{ index: 2, httpStatusCode: '400', subErrors: [{ errorMessage: 'Invalid data' }] }]
                }
            }

            const validPayloads = [
                { name: 'event1', eventType: ConversionTypeV2.PAGE_VIEW, eventActionSource: 'website', countryCode: 'US', timestamp: '2023-01-01T12:00:00Z' },
                { name: 'event2', eventType: ConversionTypeV2.PAGE_VIEW, eventActionSource: 'website', countryCode: 'US', timestamp: '2023-01-01T12:00:00Z' }
            ]

            const validPayloadIndicesBitmap = [0, 1]
            const multiStatusResponse = new MultiStatusResponse()

            const result = handleBatchResponse(response, validPayloads, validPayloadIndicesBitmap, multiStatusResponse)

            expect(result).toBe(multiStatusResponse)

            // Instead of testing private properties directly, test that the function returns
            // the same MultiStatusResponse instance that was passed in
            expect(multiStatusResponse).toBeDefined()

            // Verify the MultiStatusResponse was correctly updated
            // We'll use the setSuccessResponseAtIndex and setErrorResponseAtIndex method spies to verify
            expect(multiStatusResponse.setSuccessResponseAtIndex).toHaveBeenCalledWith(
                0,
                expect.objectContaining({
                    status: 200
                })
            )

            expect(multiStatusResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    status: 400
                })
            )
        })

        it('should handle empty success/error arrays', () => {
            const response = {
                status: 207,
                data: {
                    success: [],
                    error: []
                }
            }

            const validPayloads = [
                { name: 'event1', eventType: ConversionTypeV2.PAGE_VIEW, eventActionSource: 'website', countryCode: 'US', timestamp: '2023-01-01T12:00:00Z' },
            ]

            const validPayloadIndicesBitmap = [0]
            const multiStatusResponse = new MultiStatusResponse()

            expect(() => handleBatchResponse(response, validPayloads, validPayloadIndicesBitmap, multiStatusResponse))
                .toThrow('Something went wrong during Amazon conversion events API processing')
        })
    })

    describe('prepareEventData', () => {
        const settings = { region: Region.NA, advertiserId: '123456789' }

        it('should prepare basic event data correctly', () => {
            const payload = {
                name: 'test_event',
                eventType: ConversionTypeV2.PAGE_VIEW,
                eventActionSource: 'WEBSITE',
                countryCode: 'US',
                timestamp: '2023-01-01T12:00:00Z',
                matchKeys: {
                    email: 'test@example.com'
                },
                enable_batching: true
            }

            const result = prepareEventData(payload, settings)

            expect(result).toMatchObject({
                name: payload.name,
                eventType: payload.eventType,
                eventActionSource: 'WEBSITE',
                countryCode: payload.countryCode,
                timestamp: payload.timestamp,
            })

            // Check that matchKeys is prepared correctly
            expect(result.matchKeys).toBeDefined()
            expect(result.matchKeys?.length).toBe(1)
            expect(result.matchKeys?.[0].type).toBe('EMAIL')
            // The value should be hashed
            expect(result.matchKeys?.[0].values[0]).not.toBe('test@example.com')
        })

        it('should hash and normalize match keys', () => {
            const payload = {
                name: 'test_event',
                eventType: ConversionTypeV2.PAGE_VIEW,
                eventActionSource: 'WEBSITE',
                countryCode: 'US',
                timestamp: '2023-01-01T12:00:00Z',
                matchKeys: {
                    email: 'Test@Example.com',
                    phone: '+1 (555) 123-4567',
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St.',
                    city: 'San Francisco',
                    state: 'CA',
                    postalCode: '94105',
                    maid: 'ad-id-123',
                    rampId: 'ramp-123',
                    matchId: 'match-123'
                },
                enable_batching: true
            }

            const result = prepareEventData(payload, settings)

            expect(result.matchKeys).toBeDefined()
            expect(result.matchKeys?.length).toBe(11) // All match keys provided

            // Check that certain match keys are included but don't check actual hash values
            const matchKeyTypes = result.matchKeys?.map(mk => mk.type)
            expect(matchKeyTypes).toContain('EMAIL')
            expect(matchKeyTypes).toContain('PHONE')
            expect(matchKeyTypes).toContain('FIRST_NAME')
            expect(matchKeyTypes).toContain('MAID')

            // MAID, RAMP_ID, and MATCH_ID should not be hashed
            const maidKey = result.matchKeys?.find(mk => mk.type === 'MAID')
            expect(maidKey?.values[0]).toBe('ad-id-123')
        })

        it('should enforce the maximum limit of 11 match keys', () => {
            // Create payload with more than 11 match keys (impossible with current schema but testing the logic)
            const payload = {
                name: 'test_event',
                eventType: ConversionTypeV2.PAGE_VIEW,
                eventActionSource: 'WEBSITE',
                countryCode: 'US',
                timestamp: '2023-01-01T12:00:00Z',
                matchKeys: {
                    email: 'test1@example.com',
                    phone: '+1 (555) 123-4567',
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St.',
                    city: 'San Francisco',
                    state: 'CA',
                    postalCode: '94105',
                    maid: 'ad-id-123',
                    rampId: 'ramp-123',
                    matchId: 'match-123',
                    extraKey: 'extra' // This one should be ignored
                }
            }

            // Modify payload to add an extra key (for testing purposes)
            const modifiedPayload = {
                ...payload,
                matchKeys: {
                    ...payload.matchKeys,
                    extraKey: 'extra'
                }
            }

            const result = prepareEventData(modifiedPayload as any, settings)

            // Only 11 match keys should be included
            expect(result.matchKeys?.length).toBe(11)
        })

        it('should throw an error if no match keys are provided', () => {
            const payload = {
                name: 'test_event',
                eventType: ConversionTypeV2.PAGE_VIEW,
                eventActionSource: 'WEBSITE',
                countryCode: 'US',
                timestamp: '2023-01-01T12:00:00Z',
                matchKeys: {},
                enable_batching: true
            }

            expect(() => prepareEventData(payload, settings)).toThrow('At least one valid match key must be provided')
        })

        it('should include optional fields when provided', () => {
            const payload = {
                name: 'purchase_event',
                eventType: ConversionTypeV2.OFF_AMAZON_PURCHASES,
                eventActionSource: 'WEBSITE',
                countryCode: 'US',
                timestamp: '2023-01-01T12:00:00Z',
                value: 99.99,
                currencyCode: 'USD',
                unitsSold: 2,
                clientDedupeId: 'dedup-123',
                dataProcessingOptions: ['LIMITED_DATA_USE'],
                matchKeys: {
                    email: 'test@example.com'
                },
                consent: {
                    ipAddress: '1.2.3.4',
                    amznAdStorage: 'GRANTED',
                    amznUserData: 'GRANTED'
                },
                customAttributes: [
                    { name: 'color', dataType: 'STRING', value: 'blue' },
                    { name: 'size', dataType: 'STRING', value: 'medium' }
                ],
                enable_batching: true
            }

            const result = prepareEventData(payload, settings)

            // Check all optional fields are included
            expect(result.value).toBe(99.99)
            expect(result.currencyCode).toBe('USD')
            expect(result.unitsSold).toBe(2)
            expect(result.clientDedupeId).toBe('dedup-123')
            expect(result.dataProcessingOptions).toEqual(['LIMITED_DATA_USE'])
            expect(result.consent).toBeDefined()
            expect(result.customAttributes).toEqual(payload.customAttributes)
        })
    })
})
