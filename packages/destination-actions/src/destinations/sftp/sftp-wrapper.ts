// SFTP Wrapper class to handle SFTP operations with abort signal and logging

import { Logger } from '@segment/actions-core'
import Client from 'ssh2-sftp-client'
import ssh2 from 'ssh2'

/* eslint-disable @typescript-eslint/no-unsafe-call */
export class SFTPWrapper {
  private readonly sftp: Client
  private client?: ssh2.SFTPWrapper
  private readonly logger?: Logger

  constructor(name?: string, logger?: Logger) {
    this.sftp = new Client(name)
    this.logger = logger
  }

  async connect(options: Client.ConnectOptions) {
    try {
      this.client = await this.sftp.connect(options)
      return this.client
    } catch (error) {
      this.logger?.error('Error connecting to SFTP server:', String(error))
      throw error
    }
  }

  async put(buffer: Buffer, remoteFilePath: string, options: Client.TransferOptions = {}): Promise<string> {
    if (!this.client) {
      throw new Error('SFTP Client not connected. Call connect first.')
    }

    try {
      return await this.sftp.put(buffer, remoteFilePath, options)
    } catch (error) {
      this.logger?.error('Error uploading file to SFTP server:', String(error))
      throw error
    }
  }

  async fastPutFromBuffer(
    input: Buffer,
    remoteFilePath: string,
    options: Client.FastPutTransferOptions = {
      concurrency: 64,
      chunkSize: 32768
    }
  ): Promise<void> {
    if (!this.client) {
      throw new Error('SFTP Client not connected. Call connect first.')
    }
    try {
      return this._fastXferFromBuffer(input, remoteFilePath, options)
    } catch (error) {
      this.logger?.error('Error uploading buffer to SFTP server:', String(error))
      throw error
    }
  }

  private async _fastXferFromBuffer(
    input: Buffer,
    remoteFilePath: string,
    options: Client.FastPutTransferOptions
  ): Promise<void> {
    const fsize = input.length
    return new Promise<void>((resolve, reject) => {
      this.client?.open(remoteFilePath, 'w', (err, handle) => {
        if (err) {
          return reject(new Error(`Error opening remote file: ${err.message}`))
        }
        const concurrency = options.concurrency || 64
        const chunkSize = options.chunkSize || 32768
        const readBuffer = input
        let position = 0
        let writeRequests: Promise<void>[] = []

        const writeChunk = (chunkPos: number): Promise<void> => {
          return new Promise((chunkResolve, chunkReject) => {
            const bytesToWrite = Math.min(chunkSize, fsize - chunkPos)
            if (bytesToWrite <= 0) {
              return chunkResolve()
            }
            this.client?.write(handle, readBuffer, chunkPos, bytesToWrite, chunkPos, (writeErr) => {
              if (writeErr) {
                return chunkReject(new Error(`Error writing to remote file: ${writeErr.message}`))
              }
              chunkResolve()
            })
          })
        }

        const processWrites = async () => {
          while (position < fsize) {
            writeRequests.push(writeChunk(position))
            position += chunkSize
            if (writeRequests.length >= concurrency) {
              await Promise.all(writeRequests)
              writeRequests = []
              options?.step?.(Math.min(position, fsize), chunkSize, fsize)
            }
          }
          await Promise.all(writeRequests)
        }

        const closeHandle = (): Promise<void> => {
          return new Promise((closeResolve) => {
            this.client?.close(handle, (closeErr) => {
              if (closeErr) {
                this.logger?.warn('Error closing remote file handle:', String(closeErr.message))
              }
              closeResolve()
            })
          })
        }

        processWrites()
          .then(async () => {
            await closeHandle()
            resolve()
          })
          .catch(async (err) => {
            await closeHandle()
            reject(err)
          })
      })
    })
  }

  async end() {
    return this.sftp.end()
  }
}
