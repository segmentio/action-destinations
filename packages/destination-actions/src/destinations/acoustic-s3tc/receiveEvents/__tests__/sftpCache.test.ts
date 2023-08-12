// import { ErrorCodes, InvalidAuthenticationError } from '@segment/actions-core'
// import Client from 'ssh2-sftp-client'
// import path from 'path'
// import { Settings } from '../../generated-types'
import { checkSFTP, cache2SFTP, testAuthSFTP } from '../sftpCache'

jest.mock('@segment/actions-core')
jest.mock('ssh2-sftp-client')
jest.mock('path')
jest.mock('../generated-types')

describe('checkSFTP', () => {
  it('should expose a function', () => {
    expect(checkSFTP).toBeDefined()
  })

  it('checkSFTP should return expected output', () => {
    // const retValue = checkSFTP(settings);
    expect(false).toBeTruthy()
  })
})
describe('cache2SFTP', () => {
  it('should expose a function', () => {
    expect(cache2SFTP).toBeDefined()
  })

  it('cache2SFTP should return expected output', async () => {
    // const retValue = await cache2SFTP(sftp,settings,filename,fileContent);
    expect(false).toBeTruthy()
  })
})
describe('testAuthSFTP', () => {
  it('should expose a function', () => {
    expect(testAuthSFTP).toBeDefined()
  })

  it('testAuthSFTP should return expected output', async () => {
    // const retValue = await testAuthSFTP(sftp,settings);
    expect(false).toBeTruthy()
  })
})
