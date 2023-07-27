import { InvalidAuthenticationError } from '@segment/actions-core'
import Client from 'ssh2-sftp-client'
import path from 'path'
import { Settings } from '../generated-types'

const LIVERAMP_SFTP_SERVER = 'files.liveramp.com'
const LIVERAMP_SFTP_PORT = 22

function validateSFTP(settings: Settings) {
  if (!settings.sftp_username) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Username)')
  }

  if (!settings.sftp_password) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Password)')
  }

  if (!settings.sftp_folder_path) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing SFTP folder path.')
  }
}

async function uploadSFTP(sftp: Client, settings: Settings, filename: string, fileContent: Buffer) {
  return doSFTP(sftp, settings, async (sftp) => {
    const targetPath = path.join(settings.sftp_folder_path as string, filename)
    return sftp.put(fileContent, targetPath)
  })
}

async function doSFTP(sftp: Client, settings: Settings, action: { (sftp: Client): Promise<unknown> }) {
  await sftp.connect({
    host: LIVERAMP_SFTP_SERVER,
    port: LIVERAMP_SFTP_PORT,
    username: settings.sftp_username,
    password: settings.sftp_password
  })

  const retVal = await action(sftp)
  await sftp.end()
  return retVal
}

async function testAuthenticationSFTP(sftp: Client, settings: Settings) {
  return doSFTP(sftp, settings, async (sftp) => {
    return sftp.exists(settings.sftp_folder_path as string).then((fileType) => {
      if (!fileType) throw new Error(`Could not find path: ${settings.sftp_folder_path}`)
    })
  })
}

export { validateSFTP, uploadSFTP, testAuthenticationSFTP, Client }
