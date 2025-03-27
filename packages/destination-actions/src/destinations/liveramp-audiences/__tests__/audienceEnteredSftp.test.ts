import { uploadSFTP, doSFTP } from '../audienceEnteredSftp/sftp'
import { Payload } from '../audienceEnteredSftp/generated-types'
import { SelfTimeoutError, DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'

import Client from 'ssh2-sftp-client'

jest.mock('ssh2-sftp-client')

describe('sftp library', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  it('should upload the file successfully', async () => {
    Client.prototype.connect = jest.fn()
    Client.prototype.put = jest.fn()
    Client.prototype.end = jest.fn()

    const mockPayload: Payload = {
      sftp_folder_path: 'sftp_folder_path',
      audience_key: 'audience_key',
      delimiter: 'delimiter',
      filename: 'filename',
      enable_batching: false
    }

    await uploadSFTP(new Client(), mockPayload, 'filename', jest.fn() as any)
    expect(Client.prototype.put).toHaveBeenCalled()
  })

  // should this test ever randomly fail, please disable it without mercy
  it('should throw SelfTimeoutError when upload takes too long', async () => {
    jest.useFakeTimers()

    Client.prototype.connect = jest.fn().mockReturnValue(Promise.resolve({ success: true }))
    Client.prototype.end = jest.fn().mockReturnValue(Promise.resolve({ success: true }))

    const mockPayload: Payload = {
      sftp_folder_path: 'sftp_folder_path',
      audience_key: 'audience_key',
      delimiter: 'delimiter',
      filename: 'filename',
      enable_batching: false
    }

    const trigger = jest.fn()
    const sftpAction = jest.fn(() => {
      trigger()
      return new Promise((resolve) => {
        setTimeout(resolve, DEFAULT_REQUEST_TIMEOUT * 2) // Deliberately delay to trigger timeout
      })
    })
    const uploadPromise = doSFTP(new Client(), mockPayload, sftpAction)
    await trigger() // this happens after the timeout has been set but before it is concluded, but after the sftpAction ran

    jest.runAllTimers() //force timeout

    await expect(uploadPromise).rejects.toThrow(SelfTimeoutError)
  })
})
