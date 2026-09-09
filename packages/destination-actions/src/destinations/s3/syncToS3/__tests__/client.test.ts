import { PayloadValidationError } from '@segment/actions-core'
import { Settings } from '../../generated-types'

// Shared spies so each test can assert whether AWS was actually contacted.
const stsSend = jest.fn()
const s3Send = jest.fn()

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({ send: stsSend })),
  AssumeRoleCommand: jest.fn()
}))

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: s3Send })),
  PutObjectCommand: jest.fn(),
  _Error: jest.fn()
}))

// Import after the mocks are registered.
import { Client } from '../client'

const settings: Settings = {
  iam_role_arn: 'arn:aws:iam::123456789012:role/test',
  s3_aws_bucket_name: 'test-bucket',
  s3_aws_region: 'us-east-1',
  iam_external_id: 'external-id'
}

// assumeRole() calls STS twice (intermediary role, then the customer role); both must
// return a full set of credentials for the happy path to reach the PUT.
const validStsResponse = {
  Credentials: {
    AccessKeyId: 'AKIA_TEST',
    SecretAccessKey: 'secret',
    SessionToken: 'token'
  }
}

function newClient() {
  return new Client('us-east-1', settings.iam_role_arn, settings.iam_external_id)
}

describe('uploadS3 object key length guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    stsSend.mockResolvedValue(validStsResponse)
    s3Send.mockResolvedValue({})
  })

  it('rejects an object key over 1024 bytes with a non-retryable PayloadValidationError and does not PUT', async () => {
    const client = newClient()
    // A multi-byte folder name: 400 "€" chars = 1200 bytes but only 400 characters. This is
    // well under 1024 *characters*, so a naive `.length` check would let it through — proving the
    // guard measures UTF-8 bytes, not characters. With the "/" separator plus the generated
    // filename it comfortably exceeds the 1024-byte limit.
    const overLongFolder = '€'.repeat(400)

    const promise = client.uploadS3(settings, 'file,content', '', overLongFolder, 'csv')

    await expect(promise).rejects.toThrow(PayloadValidationError)
    await expect(promise).rejects.toThrow('1024 bytes')
    // Fails fast: no role assumption and no PUT are attempted.
    expect(stsSend).not.toHaveBeenCalled()
    expect(s3Send).not.toHaveBeenCalled()
  })

  it('does not leak the (potentially PII-laden) key content in the error message', async () => {
    const client = newClient()
    const secretFolder = 'super-secret-pii-'.repeat(80) // > 1024 bytes

    const error = await client.uploadS3(settings, 'file,content', '', secretFolder, 'csv').catch((e) => e as Error)

    expect(error).toBeInstanceOf(PayloadValidationError)
    expect(error.message).not.toContain('super-secret-pii')
  })

  it('proceeds to PUT for an object key at/below 1024 bytes', async () => {
    const client = newClient()

    const result = await client.uploadS3(settings, 'file,content', 'export', 'my-folder', 'csv')

    expect(result).toEqual({ statusCode: 200, message: 'Upload successful' })
    expect(s3Send).toHaveBeenCalledTimes(1)
  })
})

describe('uploadS3 object key character validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    stsSend.mockResolvedValue(validStsResponse)
    s3Send.mockResolvedValue({})
  })

  it('rejects an object key with a disallowed character and does not PUT', async () => {
    const client = newClient()

    // A space (in the filename prefix) is outside the AWS "safe" set.
    const promise = client.uploadS3(settings, 'file,content', 'my file', 'folder', 'csv')

    await expect(promise).rejects.toThrow(PayloadValidationError)
    await expect(promise).rejects.toThrow('outside the allowed set')
    await expect(promise).rejects.toThrow('filename prefix has disallowed character(s)')
    // Fails fast: no role assumption and no PUT are attempted.
    expect(stsSend).not.toHaveBeenCalled()
    expect(s3Send).not.toHaveBeenCalled()
  })

  it('names the offending part(s) and their distinct characters but not the full key', async () => {
    const client = newClient()

    // Disallowed char in each part: '@' in the filename prefix, '#' in the folder name.
    const error = await client
      .uploadS3(settings, 'file,content', 'user@example', 'reports#secret-pii', 'csv')
      .catch((e) => e as Error)

    expect(error).toBeInstanceOf(PayloadValidationError)
    // Points at both parts and lists the distinct bad characters.
    expect(error.message).toContain("folder name has disallowed character(s): '#'")
    expect(error.message).toContain("filename prefix has disallowed character(s): '@'")
    // The surrounding (potentially PII-laden) values are not echoed.
    expect(error.message).not.toContain('secret-pii')
    expect(error.message).not.toContain('user@example')
  })

  it('accepts a key using the full allowed set (letters, digits, / ! - _ . * \' ( )) and PUTs', async () => {
    const client = newClient()

    const result = await client.uploadS3(settings, 'file,content', "export-file_v1.2*('ok')", 'my-folder', 'csv')

    expect(result).toEqual({ statusCode: 200, message: 'Upload successful' })
    expect(s3Send).toHaveBeenCalledTimes(1)
  })
})

// Systematic coverage of the character categories in AWS's object key naming guidelines:
// https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
// Policy: allow only the "Safe characters" set plus "/" (folder delimiter); reject everything else
// ("characters that might require special handling" — except "/" — plus "characters to avoid",
// ASCII control characters, and any non-ASCII / non-printable byte).
describe('uploadS3 object key — AWS object-keys guideline coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    stsSend.mockResolvedValue(validStsResponse)
    s3Send.mockResolvedValue({})
  })

  const reject = async (filenamePrefix: string, folder = '') => {
    const promise = newClient().uploadS3(settings, 'body', filenamePrefix, folder, 'csv')
    await expect(promise).rejects.toBeInstanceOf(PayloadValidationError)
    await expect(promise).rejects.toThrow('outside the allowed set')
    // Fails fast, before any AWS call.
    expect(stsSend).not.toHaveBeenCalled()
    expect(s3Send).not.toHaveBeenCalled()
  }

  const accept = async (filenamePrefix: string, folder = '') => {
    const result = await newClient().uploadS3(settings, 'body', filenamePrefix, folder, 'csv')
    expect(result).toEqual({ statusCode: 200, message: 'Upload successful' })
    expect(s3Send).toHaveBeenCalledTimes(1)
  }

  // --- "Safe characters": accepted ---
  const SAFE_SPECIALS = ['!', '-', '_', '.', '*', "'", '(', ')']
  it.each(SAFE_SPECIALS)('accepts safe special character %j', async (ch) => {
    await accept(`file${ch}name`)
  })

  it('accepts a key mixing letters, digits, and every safe special character', async () => {
    await accept("aZ09-file_name.v1*(final)!'")
  })

  it('accepts "/" as the folder path separator (multi-level paths)', async () => {
    await accept('report', 'team/exports/2026/09')
  })

  // --- "Characters that might require special handling": rejected (except "/", tested above) ---
  const SPECIAL_HANDLING = ['&', '$', '@', '=', ';', ':', '+', ' ', ',', '?']
  it.each(SPECIAL_HANDLING)('rejects special-handling character %j', async (ch) => {
    await reject(`file${ch}name`)
  })

  // --- "Characters to avoid": rejected ---
  const AVOID = ['\\', '{', '^', '}', '%', '`', ']', '"', '>', '[', '~', '<', '#', '|']
  it.each(AVOID)('rejects avoid character %j', async (ch) => {
    await reject(`file${ch}name`)
  })

  // --- ASCII control characters (0x00-0x1F, 0x7F): rejected ---
  const CONTROL_CODES = [0x00, 0x09, 0x0a, 0x0d, 0x1f, 0x7f] // NUL, TAB, LF, CR, US, DEL
  it.each(CONTROL_CODES.map((code) => [code.toString(16).padStart(2, '0'), String.fromCharCode(code)] as const))(
    'rejects ASCII control character 0x%s',
    async (_hex, ch) => {
      await reject(`file${ch}name`)
    }
  )

  // --- Non-ASCII / non-printable bytes: rejected ---
  const NON_ASCII = ['\u00E9', '\u20AC', '\u4E2D', '\u00A0'] // accented latin, euro sign, CJK, non-breaking space
  it.each(NON_ASCII)('rejects non-ASCII character %j', async (ch) => {
    await reject(`file${ch}name`)
  })

  it('rejects a multi-code-unit emoji in the key', async () => {
    await reject('launch\u{1F680}') // 🚀
  })

  it('reports a non-BMP character as a single code point (U+XXXX), not surrogate halves', async () => {
    const err = await newClient().uploadS3(settings, 'body', 'launch\u{1F680}', '', 'csv').catch((e) => e as Error)
    // With the regex `u` flag the emoji is one code point, rendered U+1F680 — not "\ud83d", "\ude00".
    expect(err.message).toContain('U+1F680')
    expect(err.message).not.toContain('ud83d')
  })

  // --- Reporting completeness ---
  it('de-duplicates repeated disallowed characters within a part', async () => {
    const err = await newClient().uploadS3(settings, 'body', 'a#b#c@d@', '', 'csv').catch((e) => e as Error)
    expect(err.message).toContain("filename prefix has disallowed character(s): '#', '@'")
  })

  it('caps the number of distinct disallowed characters listed per part', async () => {
    // 13 distinct disallowed characters; only the first 10 are listed, then "...and 3 more".
    // Order of first appearance: # % ^ ~ < > | { } [  (shown)  then  ] " @  (elided).
    const err = await newClient().uploadS3(settings, 'body', 'a#%^~<>|{}[]"@', '', 'csv').catch((e) => e as Error)
    expect(err.message).toContain('...and 3 more')
    expect(err.message).toContain("'['") // 10th distinct char is listed
    expect(err.message).not.toContain("']'") // 11th distinct char is elided
  })
})
