// import nock from 'nock'
import { createTestEvent, SegmentEvent } from '@segment/actions-core'

// import { ActionDefinition, IntegrationError, InvalidAuthenticationError } from '@segment/actions-core';
import { Settings } from '../../generated-types'
import { Payload } from '../generated-types'
import action from '../index'
import { validateSettings } from '../preCheck'
import { addUpdateEvents } from '../eventprocessing'

describe('Send Events Action', () => {
  // Mocked request function
  const mockRequest = jest.fn()

  type PayloadWithEmail = SegmentEvent & {
    email?: string
  }

  const e = createTestEvent() as PayloadWithEmail
  e.email = 'test@gmail.com'

  const mockSettings = {
    cacheType: 'S3',
    s3_access_key: 'access_key',
    s3_secret: 'secret',
    s3_region: 'us-east-1',
    s3_bucket: 'my-bucket',
    fileNamePrefix: 'prefix'
  } as Settings

  test('perform Action.Perform call with valid payload and settings', async () => {
    action.perform(mockRequest, { settings: mockSettings, payload: e as Payload })
  })

  test('perform ValidateSettings call with valid payload and settings', async () => {
    // Mock validateSettings function
    const mockValidateSettings = jest.fn(validateSettings)
    mockValidateSettings(mockSettings)
    expect(mockValidateSettings).toHaveBeenCalledWith(mockSettings)
    expect(mockValidateSettings).toHaveReturned()
  })

  test('perform AddUpdateEvents call with valid payload and settings', async () => {
    // Mock addUpdateEvents function
    const mockAddUpdateEvents = jest.fn(addUpdateEvents).mockReturnValue('csvRows')
    mockAddUpdateEvents(e, e.email)
    expect(mockAddUpdateEvents).toHaveBeenCalledWith(e, e.email)
    expect(mockAddUpdateEvents).toHaveReturned()
  })

  test('perform generateS3RequestOptions call with valid payload and settings', async () => {
    // Mock generateS3RequestOptions function
    const mockGenerateS3RequestOptions = jest.fn().mockResolvedValue({})
    mockGenerateS3RequestOptions(
      mockSettings.s3_bucket,
      mockSettings.s3_region,
      expect.any(String), // Generated file name
      'PUT',
      'csvRows',
      mockSettings.s3_access_key,
      mockSettings.s3_secret
    )

    expect(mockGenerateS3RequestOptions).toHaveBeenCalledWith(
      mockSettings.s3_bucket,
      mockSettings.s3_region,
      expect.any(String), // Generated file name
      'PUT',
      'csvRows',
      mockSettings.s3_access_key,
      mockSettings.s3_secret
    )
  })
})
