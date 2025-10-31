import sftp from 'ssh2-sftp-client'
import ssh2 from 'ssh2'
export class SFTClientCustom {
  private readonly sftp: sftp
  private client: ssh2.SFTPWrapper

  constructor(readonly name?: string) {
    this.sftp = new sftp(this.name)
  }

  async connect(options: sftp.ConnectOptions) {
    this.client = await this.sftp.connect(options)
    return this.client
  }

  async fastPutFromBuffer(
    input: Buffer,
    remoteFilePath: string,
    options: sftp.FastPutTransferOptions = {
      concurrency: 64,
      chunkSize: 32768
    }
  ): Promise<void> {
    if (!this.client) {
      throw new Error('SFTP Client not connected. Call connect first.')
    }
    return this._fastXferFromBuffer(input, remoteFilePath, options)
  }

  private async _fastXferFromBuffer(
    input: Buffer,
    remoteFilePath: string,
    options: sftp.FastPutTransferOptions
  ): Promise<void> {
    const fsize = input.length
    return new Promise<void>((resolve, reject) => {
      this.client.open(remoteFilePath, 'w', (err, handle) => {
        if (err) {
          throw new Error(`Error opening remote file: ${err.message}`)
        }
        const concurrency = options.concurrency || 64
        const chunkSize = options.chunkSize || 32768
        const readBuffer = input
        const writeBuffer = Buffer.alloc(chunkSize)
        let position = 0
        let writeRequests: Promise<void>[] = []

        const writeChunk = (chunkPos: number): Promise<void> => {
          return new Promise((resolve, reject) => {
            const bytesToWrite = Math.min(chunkSize, fsize - chunkPos)
            if (bytesToWrite <= 0) {
              return resolve()
            }
            readBuffer.copy(writeBuffer, 0, chunkPos, chunkPos + bytesToWrite)
            this.client.write(handle, writeBuffer, 0, bytesToWrite, chunkPos, (err) => {
              if (err) {
                return reject(new Error(`Error writing to remote file: ${err.message}`))
              }
              resolve()
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

        processWrites()
          .then(() => resolve())
          .catch((err) => reject(err))
          .finally(() => {
            this.client.close(handle, (err) => {
              if (err) {
                // Log the error but do not reject, as the main operation is complete
                console.error(`Error closing remote file: ${err.message}`)
              }
            })
          })
      })
    })
  }

  end() {
    return this.sftp.end()
  }
}
