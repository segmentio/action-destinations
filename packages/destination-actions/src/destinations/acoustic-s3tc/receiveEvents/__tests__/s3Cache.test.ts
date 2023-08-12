// import generateS3RequestOptions from '../../../../lib/AWS/s3'
// import { InvalidAuthenticationError, ModifiedResponse, RequestOptions } from '@segment/actions-core'
// import { Settings } from '../../generated-types'
import { putS3 } from '../s3Cache'

jest.mock('../../../lib/AWS/s3')
jest.mock('@segment/actions-core')
jest.mock('../generated-types')

describe('putS3', () => {
  it('should expose a function', () => {
    expect(putS3).toBeDefined()
  })

  it('putS3 should return expected output', async () => {
    // const retValue = await putS3(settings,filename,fileContent,request);
    expect(false).toBeTruthy()
  })
})
