// eslint-disable-next-line no-var
var sftpPut = jest.fn().mockImplementation((fileContent, path) => {
  // Convert Buffer to string for better snapshot readability
  if (Buffer.isBuffer(fileContent)) {
    return {
      data: fileContent.toString(),
      path: path
    }
  }
  return { data: fileContent, path: path }
})

import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../index'
import { enquoteIdentifier } from '../operations'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'SFTP'

jest.mock('ssh2-sftp-client', () => {
  const sftpClient = {
    put: sftpPut,
    connect: jest.fn(),
    end: jest.fn()
  }
  return jest.fn(() => sftpClient)
})

describe(`Testing snapshot for ${destinationSlug}'s syncToSFTP destination action:`, () => {
  const actionSlug = 'syncToSFTP'
  beforeAll(() => {
    const mockDate = new Date(12345)
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string)
  })

  beforeEach(() => {
    sftpPut.mockClear()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should work with default mappings', async () => {
    const events = Array.from({ length: 25 }, (_, i) =>
      createTestEvent({
        userId: `user${i + 1}`,
        type: 'track',
        event: 'Audience Entered',
        properties: {
          audience_key: `test-audience-${i + 1}`,
          email: `user${i + 1}@example.com`
        }
      })
    )

    const mapping = {
      sftp_host: 'test.example.com',
      sftp_username: 'testuser',
      sftp_password: 'testpass',
      sftp_folder_path: '/uploads',
      audience_key: {
        '@path': '$.userId'
      },
      identifier_data: {
        email: {
          '@path': '$.properties.email'
        }
      },
      delimiter: ',',
      filename: 'audience_test.csv',
      enable_batching: true
    }

    await testDestination.testBatchAction(actionSlug, {
      events,
      mapping,
      settings: {}
    })

    // Convert mock calls to readable format for snapshot
    const readableCalls = sftpPut.mock.calls.map((call) => {
      const [fileContent, path] = call
      return [Buffer.isBuffer(fileContent) ? fileContent.toString() : fileContent, path]
    })
    expect(readableCalls).toMatchSnapshot()
  })

  it('should handle various identifier data types', async () => {
    const events = [
      createTestEvent({
        userId: 'user1',
        type: 'track',
        event: 'Audience Entered',
        properties: {
          email: 'test1@example.com',
          phone: '+1-555-123-4567',
          age: 25
        }
      }),
      createTestEvent({
        userId: 'user2',
        type: 'track',
        event: 'Audience Entered',
        properties: {
          email: 'test2@example.com',
          name: 'Jane Smith',
          city: 'New York'
        }
      })
    ]

    // Add more events to reach minimum threshold
    for (let i = 3; i <= 25; i++) {
      events.push(
        createTestEvent({
          userId: `user${i}`,
          type: 'track',
          event: 'Audience Entered',
          properties: {
            email: `test${i}@example.com`
          }
        })
      )
    }

    const mapping = {
      sftp_host: 'test.example.com',
      sftp_username: 'testuser',
      sftp_password: 'testpass',
      sftp_folder_path: '/uploads',
      audience_key: {
        '@path': '$.userId'
      },
      identifier_data: {
        email: {
          '@path': '$.properties.email'
        },
        phone: {
          '@path': '$.properties.phone'
        },
        name: {
          '@path': '$.properties.name'
        },
        city: {
          '@path': '$.properties.city'
        },
        age: {
          '@path': '$.properties.age'
        }
      },
      delimiter: ',',
      filename: 'audience_mixed.csv',
      enable_batching: true
    }

    await testDestination.testBatchAction(actionSlug, {
      events,
      mapping,
      settings: {}
    })

    // Convert mock calls to readable format for snapshot
    const readableCalls = sftpPut.mock.calls.map((call) => {
      const [fileContent, path] = call
      return [Buffer.isBuffer(fileContent) ? fileContent.toString() : fileContent, path]
    })
    expect(readableCalls).toMatchSnapshot()
  })
})

describe('enquoteIdentifier', () => {
  it('should quote values correctly', () => {
    expect(enquoteIdentifier('simple')).toMatchSnapshot()
    expect(enquoteIdentifier('with "quotes"')).toMatchSnapshot()
    expect(enquoteIdentifier('with,comma')).toMatchSnapshot()
    expect(enquoteIdentifier('')).toMatchSnapshot()
  })
})
