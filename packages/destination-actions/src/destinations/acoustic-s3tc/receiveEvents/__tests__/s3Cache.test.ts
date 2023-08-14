import { putS3 } from '../s3Cache'
import generateS3RequestOptions from '../../../../lib/AWS/s3'

jest.mock('@segment/actions-core')
jest.mock('../generated-types')

// describe('putS3', () => {
//   it('should expose a function', () => {
//     expect(putS3).toBeDefined()
//   })

//   it('putS3 should return expected output', async () => {
//     // const retValue = await putS3(settings,filename,fileContent,request);
//     expect(false).toBeTruthy()
//   })
// })

describe('putS3', () => {
  const mockSettings = {
    s3_bucket: 'my-bucket',
    s3_region: 'us-east-1',
    s3_access_key: 'access_key',
    s3_secret: 'secret',
    cacheType: 'S3',
    __segment_internal_engage_force_full_sync: false,
    __segment_internal_engage_batch_sync: false
    // Add other required fields as needed
  }

  const mockFilename = 'example.csv'
  const mockFileContent = 'file content'

  const mockRequest = jest.fn().mockResolvedValue({}) // Mock the request function

  test('generates S3 request options and performs PUT request', async () => {
    const expectedResult = {} // Mock the expected result of the PUT request

    // Mock generateS3RequestOptions function
    const mockGenerateS3RequestOptions = jest.fn(generateS3RequestOptions).mockResolvedValue({
      headers: { 'Content-Type': 'text/plain' },
      method: 'PUT',
      host: 'example-host',
      path: 'example-path',
      body: 'example-body'
    })

    // Replace the actual import with the mock function
    jest.mock('../../../../lib/AWS/s3', () => {
      return {
        __esModule: true,
        default: mockGenerateS3RequestOptions
      }
    })

    void mockGenerateS3RequestOptions(
      mockSettings.s3_bucket,
      mockSettings.s3_region,
      mockFilename,
      'PUT',
      mockFileContent,
      mockSettings.s3_access_key,
      mockSettings.s3_secret
    )

    const result = await putS3(mockSettings, mockFilename, mockFileContent, mockRequest)

    expect(result).toEqual(expectedResult)

    expect(mockGenerateS3RequestOptions).toHaveBeenCalledWith(
      mockSettings.s3_bucket,
      mockSettings.s3_region,
      mockFilename,
      'PUT',
      mockFileContent,
      mockSettings.s3_access_key,
      mockSettings.s3_secret
    )
  })
})
