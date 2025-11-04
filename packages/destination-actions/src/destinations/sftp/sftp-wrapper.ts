// SFTP Wrapper class to handle SFTP operations with abort signal and logging

import { Logger } from '@segment/actions-core'
import Client from 'ssh2-sftp-client'
import ssh2 from 'ssh2'

interface FastPutFromBufferOptions {
  concurrency?: number
  chunkSize?: number
}

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

  // Custom implementation of fastPut from Buffer
  // This method uploads a Buffer to the SFTP server using concurrent writes
  async fastPutFromBuffer(
    input: Buffer,
    remoteFilePath: string,
    options: FastPutFromBufferOptions = {}
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
    options: FastPutFromBufferOptions
  ): Promise<void> {
    const fsize = input.length
    return new Promise<void>((resolve, reject) => {
      // Open the connection to the remote file
      this.client?.open(remoteFilePath, 'w', (err, handle) => {
        if (err) {
          return reject(new Error(`Error opening remote file: ${err.message}`))
        }
        const concurrency = options.concurrency || 64
        const chunkSize = options.chunkSize || 32768
        const readBuffer = input
        let position = 0
        let writeRequests: Promise<void>[] = []

        // function that writes a chunk to the remote file
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

        // function that splits the writes into concurrent requests and processes them
        const processWrites = async () => {
          while (position < fsize) {
            writeRequests.push(writeChunk(position))
            position += chunkSize
            if (writeRequests.length >= concurrency) {
              await Promise.all(writeRequests)
              writeRequests = []
            }
          }
          await Promise.all(writeRequests)
        }

        processWrites()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            // we don't care if close fails here because we expect the caller to call sftp.end() eventually
            this.client?.close(handle, (closeErr) => {
              if (closeErr) {
                this.logger?.warn('Error closing remote file handle:', String(closeErr.message))
              }
            })
          })
      })
    })
  }

  async end() {
    // Close the SFTP connection
    return this.sftp.end()
  }
}
