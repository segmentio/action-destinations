import { InvalidAuthenticationError } from '@segment/actions-core'
import Client from 'ssh2-sftp-client'
import path from 'path'
import { Payload } from './generated-types'

const LIVERAMP_SFTP_SERVER = 'files.liveramp.com'
const LIVERAMP_SFTP_PORT = 22

function validateSFTP(payload: Payload) {
  if (!payload.sftp_username) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Username)')
  }

  if (!payload.sftp_password) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Password)')
  }

  if (!payload.sftp_folder_path) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing SFTP folder path.')
  }
}

async function uploadSFTP(sftp: Client, payload: Payload, filename: string, fileContent: Buffer) {
  return doSFTP(sftp, payload, async (sftp) => {
    const targetPath = path.join(payload.sftp_folder_path as string, filename)
    return sftp.put(fileContent, targetPath)
  })
}

async function doSFTP(sftp: Client, payload: Payload, action: { (sftp: Client): Promise<unknown> }) {
  await sftp.connect({
    host: LIVERAMP_SFTP_SERVER,
    port: LIVERAMP_SFTP_PORT,
    username: payload.sftp_username,
    password: payload.sftp_password
  })

  const retVal = await action(sftp)
  await sftp.end()
  return retVal
}

async function testAuthenticationSFTP(sftp: Client, payload: Payload) {
  return doSFTP(sftp, payload, async (sftp) => {
    return sftp.exists(payload.sftp_folder_path as string).then((fileType) => {
      if (!fileType) throw new Error(`Could not find path: ${payload.sftp_folder_path}`)
    })
  })
}

export { validateSFTP, uploadSFTP, testAuthenticationSFTP, Client }
