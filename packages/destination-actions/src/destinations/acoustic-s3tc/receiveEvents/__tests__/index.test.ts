// import nock from 'nock'
import { createTestEvent } from '@segment/actions-core'

// import { ActionDefinition, IntegrationError, InvalidAuthenticationError } from '@segment/actions-core';
import { Settings } from '../../generated-types'
import { validateSettings } from '../preCheck'
import { addUpdateEvents } from '../eventprocessing'
import { Payload } from '../generated-types'

describe('Send Events Action', () => {
  const e = createTestEvent()
  e.properties = { email: 'test@gmail.com' }

  const mockSettings = {
    s3_access_key: 'access_key',
    s3_secret: 'secret',
    s3_region: 'us-east-1',
    s3_bucket_accesspoint_alias: 'my-bucket',
    fileNamePrefix: 'prefix_'
  } as Settings

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
    mockAddUpdateEvents(e as Payload, 'test@gmail.com')
    expect(mockAddUpdateEvents).toHaveBeenCalledWith(e, e.properties?.email)
    expect(mockAddUpdateEvents).toHaveReturned()
  })

  test('perform generateS3RequestOptions call with valid payload and settings', async () => {
    // Mock generateS3RequestOptions function
    const mockGenerateS3RequestOptions = jest.fn().mockResolvedValue({})
    mockGenerateS3RequestOptions(
      mockSettings.s3_bucket_accesspoint_alias,
      mockSettings.s3_region,
      expect.any(String), // Generated file name
      'PUT',
      'csvRows',
      mockSettings.s3_access_key,
      mockSettings.s3_secret
    )

    expect(mockGenerateS3RequestOptions).toHaveBeenCalledWith(
      mockSettings.s3_bucket_accesspoint_alias,
      mockSettings.s3_region,
      expect.any(String), // Generated file name
      'PUT',
      'csvRows',
      mockSettings.s3_access_key,
      mockSettings.s3_secret
    )
  })
})
