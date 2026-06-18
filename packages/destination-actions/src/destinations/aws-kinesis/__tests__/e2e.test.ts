/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="jest" />
import fetch from 'node-fetch'

/**
 * E2E tests for AWS Kinesis
 *
 * These tests make real HTTP calls to a running local serve server.
 * They are NOT run in CI — they require real infrastructure credentials.
 *
 * Prerequisites:
 *   1. Start the serve server:
 *      ./bin/run serve --destination aws-kinesis --noUI
 *
 *   2. Set environment variables (or create a .env file):
 *      export BASE_URL=http://localhost:3000
 *      export IAM_ROLE_ARN=arn:aws:iam::123456789012:role/your-role
 *      export IAM_EXTERNAL_ID=your-external-id
 *      export STREAM_NAME=your-kinesis-stream
 *      export AWS_REGION=us-west-2
 *
 *   3. Run the tests:
 *      yarn cloud jest --testPathPattern="aws-kinesis/__tests__/e2e"
 */

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000'
const IAM_ROLE_ARN =
  process.env.IAM_ROLE_ARN ?? 'arn:aws:iam::355207333203:role/mm2e-e2e-service-stage-us-west-2-forwarder'
const IAM_EXTERNAL_ID = process.env.IAM_EXTERNAL_ID ?? 'mm2e-e2e-service-stage-us-west-2'
const STREAM_NAME = process.env.STREAM_NAME ?? 'mm2e-e2e-service-stage-us-west-2'
const AWS_REGION = process.env.AWS_REGION ?? 'us-west-2'

async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return {
    status: res.status,
    body: await res.json()
  }
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`)
  return {
    status: res.status,
    body: await res.json()
  }
}

function sendPayload(
  payload: Record<string, unknown> | Record<string, unknown>[],
  mappingOverrides?: Record<string, unknown>
) {
  return post('/send', {
    settings: {
      iamRoleArn: IAM_ROLE_ARN,
      iamExternalId: IAM_EXTERNAL_ID
    },
    payload,
    mapping: {
      payload: { '@path': '$.' },
      partitionKey: { '@path': '$.messageId' },
      streamName: STREAM_NAME,
      awsRegion: AWS_REGION,
      max_batch_size: 500,
      batch_bytes: 1000000,
      ...mappingOverrides
    }
  })
}

describe('AWS Kinesis E2E', () => {
  beforeAll(async () => {
    try {
      await get('/manifest')
    } catch (err) {
      throw new Error(
        'Serve server is not running. Start it with:\n' +
          '  ./bin/run serve --destination aws-kinesis --noUI\n' +
          '  Error: ' +
          (err as Error).message
      )
    }
  })

  describe('Authentication', () => {
    it('01 - returns ok:true for valid credentials', async () => {
      const res = await post('/authenticate', {
        iamRoleArn: IAM_ROLE_ARN,
        iamExternalId: IAM_EXTERNAL_ID
      })
      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)
    })

    it('02 - returns ok:false for invalid ARN format', async () => {
      const res = await post('/authenticate', {
        iamRoleArn: 'not-a-valid-arn',
        iamExternalId: IAM_EXTERNAL_ID
      })
      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(false)
    })

    it('03 - returns ok:false for empty ARN', async () => {
      const res = await post('/authenticate', {
        iamRoleArn: '',
        iamExternalId: IAM_EXTERNAL_ID
      })
      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(false)
    })

    it('04 - ARN with special chars +=,.@_-/ passes regex validation', async () => {
      const res = await post('/authenticate', {
        iamRoleArn: 'arn:aws:iam::355207333203:role/test+role=name,with.special@chars_and-slash/path',
        iamExternalId: IAM_EXTERNAL_ID
      })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('ok')
    })

    it('05 - wrong external ID rejected by trust policy', async () => {
      const res = await post('/authenticate', {
        iamRoleArn: IAM_ROLE_ARN,
        iamExternalId: 'totally-wrong-external-id'
      })
      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(false)
    })

    it('06 - nonexistent account/role returns ok:false', async () => {
      const res = await post('/authenticate', {
        iamRoleArn: 'arn:aws:iam::000000000000:role/nonexistent-role',
        iamExternalId: 'some-id'
      })
      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(false)
    })
  })

  describe('Send - Single Events', () => {
    it('07 - track event delivered via perform()', async () => {
      const res = await sendPayload({
        type: 'track',
        event: 'Test Event',
        messageId: 'msg-e2e-track',
        userId: 'user-1'
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('08 - identify event delivered via perform()', async () => {
      const res = await sendPayload({
        type: 'identify',
        messageId: 'msg-e2e-identify',
        userId: 'user-1',
        traits: { name: 'Test User' }
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('09 - page event delivered via perform()', async () => {
      const res = await sendPayload({
        type: 'page',
        name: 'Home',
        messageId: 'msg-e2e-page',
        userId: 'user-1'
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('10 - screen event delivered via perform()', async () => {
      const res = await sendPayload({
        type: 'screen',
        name: 'Dashboard',
        messageId: 'msg-e2e-screen',
        userId: 'user-1'
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('11 - group event delivered via perform()', async () => {
      const res = await sendPayload({
        type: 'group',
        groupId: 'group-1',
        messageId: 'msg-e2e-group',
        userId: 'user-1'
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })

  describe('Send - Validation Errors', () => {
    it('12 - missing partitionKey returns AggregateAjvError', async () => {
      const res = await post('/send', {
        settings: { iamRoleArn: IAM_ROLE_ARN, iamExternalId: IAM_EXTERNAL_ID },
        payload: { type: 'track', event: 'Test', userId: 'user-1' },
        mapping: {
          payload: { '@path': '$.' },
          streamName: STREAM_NAME,
          awsRegion: AWS_REGION,
          max_batch_size: 500,
          batch_bytes: 1000000
        }
      })
      expect(res.status).toBe(200)
      expect(res.body[0].message).toContain('partitionKey')
    })

    it('13 - missing streamName returns AggregateAjvError', async () => {
      const res = await post('/send', {
        settings: { iamRoleArn: IAM_ROLE_ARN, iamExternalId: IAM_EXTERNAL_ID },
        payload: { type: 'track', event: 'Test', messageId: 'msg-1', userId: 'user-1' },
        mapping: {
          payload: { '@path': '$.' },
          partitionKey: { '@path': '$.messageId' },
          awsRegion: AWS_REGION,
          max_batch_size: 500,
          batch_bytes: 1000000
        }
      })
      expect(res.status).toBe(200)
      expect(res.body[0].message).toContain('streamName')
    })

    it('14 - missing awsRegion returns AggregateAjvError', async () => {
      const res = await post('/send', {
        settings: { iamRoleArn: IAM_ROLE_ARN, iamExternalId: IAM_EXTERNAL_ID },
        payload: { type: 'track', event: 'Test', messageId: 'msg-1', userId: 'user-1' },
        mapping: {
          payload: { '@path': '$.' },
          partitionKey: { '@path': '$.messageId' },
          streamName: STREAM_NAME,
          max_batch_size: 500,
          batch_bytes: 1000000
        }
      })
      expect(res.status).toBe(200)
      expect(res.body[0].message).toContain('awsRegion')
    })

    it('15 - missing payload returns AggregateAjvError', async () => {
      const res = await post('/send', {
        settings: { iamRoleArn: IAM_ROLE_ARN, iamExternalId: IAM_EXTERNAL_ID },
        payload: { type: 'track', event: 'Test', messageId: 'msg-1', userId: 'user-1' },
        mapping: {
          partitionKey: { '@path': '$.messageId' },
          streamName: STREAM_NAME,
          awsRegion: AWS_REGION,
          max_batch_size: 500,
          batch_bytes: 1000000
        }
      })
      expect(res.status).toBe(200)
      expect(res.body[0].message).toContain('payload')
    })

    it('16 - batch_size below min (0) fails constraint', async () => {
      const res = await sendPayload(
        { type: 'track', event: 'Test', messageId: 'msg-1', userId: 'user-1' },
        { batch_size: 0 }
      )
      expect(res.status).toBe(200)
      expect(res.body[0].message).toBeDefined()
    })

    it('17 - batch_size above max (501) fails constraint', async () => {
      const res = await sendPayload(
        { type: 'track', event: 'Test', messageId: 'msg-1', userId: 'user-1' },
        { batch_size: 501 }
      )
      expect(res.status).toBe(200)
      expect(res.body[0].message).toBeDefined()
    })

    it('18 - max_batch_size below min (0) fails constraint', async () => {
      const res = await sendPayload(
        { type: 'track', event: 'Test', messageId: 'msg-1', userId: 'user-1' },
        { max_batch_size: 0 }
      )
      expect(res.status).toBe(200)
      expect(res.body[0].message).toBeDefined()
    })

    it('19 - max_batch_size above max (501) fails constraint', async () => {
      const res = await sendPayload(
        { type: 'track', event: 'Test', messageId: 'msg-1', userId: 'user-1' },
        { max_batch_size: 501 }
      )
      expect(res.status).toBe(200)
      expect(res.body[0].message).toBeDefined()
    })
  })

  describe('Send - Batching', () => {
    it('20 - enable_batching=false routes through perform()', async () => {
      const res = await sendPayload(
        { type: 'track', event: 'Test', messageId: 'msg-1', userId: 'user-1' },
        { enable_batching: false }
      )
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('21 - 2 track events delivered via performBatch()', async () => {
      const res = await sendPayload([
        { type: 'track', event: 'Event 1', messageId: 'msg-batch-1', userId: 'user-1' },
        { type: 'track', event: 'Event 2', messageId: 'msg-batch-2', userId: 'user-2' }
      ])
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('22 - mixed track+identify via performBatch()', async () => {
      const res = await sendPayload([
        { type: 'track', event: 'Test Event', messageId: 'msg-mix-1', userId: 'user-1' },
        { type: 'identify', messageId: 'msg-mix-2', userId: 'user-2', traits: { name: 'User' } }
      ])
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('23 - page+screen+group via performBatch()', async () => {
      const res = await sendPayload([
        { type: 'page', name: 'Home', messageId: 'msg-psg-1', userId: 'user-1' },
        { type: 'screen', name: 'Dashboard', messageId: 'msg-psg-2', userId: 'user-2' },
        { type: 'group', groupId: 'grp-1', messageId: 'msg-psg-3', userId: 'user-3' }
      ])
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('24 - custom batch_size accepted via performBatch()', async () => {
      const res = await sendPayload(
        [
          { type: 'track', event: 'Event 1', messageId: 'msg-bs-1', userId: 'user-1' },
          { type: 'track', event: 'Event 2', messageId: 'msg-bs-2', userId: 'user-2' }
        ],
        { batch_size: 100 }
      )
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })

  describe('Send - Error Paths', () => {
    it('25 - invalid role triggers handleError generic branch → DEPENDENCY_ERROR 500', async () => {
      const res = await post('/send', {
        settings: {
          iamRoleArn: 'arn:aws:iam::000000000000:role/nonexistent-role',
          iamExternalId: 'bad-id'
        },
        payload: { type: 'track', event: 'Test', messageId: 'msg-err', userId: 'user-1' },
        mapping: {
          payload: { '@path': '$.' },
          partitionKey: { '@path': '$.messageId' },
          streamName: STREAM_NAME,
          awsRegion: AWS_REGION,
          max_batch_size: 500,
          batch_bytes: 1000000
        }
      })
      expect(res.status).toBe(200)
      expect(res.body[0].statusCode).toBe(500)
    })
  })

  describe('Skipped (not testable via HTTP)', () => {
    // Cannot trigger AccessDeniedException from Kinesis via HTTP.
    // This branch fires when error.name === 'AccessDeniedException' from the Kinesis PutRecordsCommand.
    // Requires a role that can be assumed via STS but has no kinesis:PutRecords permission on the stream.
    it.skip('26 - handleError AccessDeniedException branch → 403', () => {})

    // Cannot trigger AbortError via HTTP request.
    // This branch fires when the AbortSignal passed to client.send(command, { abortSignal: signal })
    // is triggered. The signal comes from Segment runtime infrastructure, not from the request payload.
    it.skip('27 - AbortError → RequestTimeoutError', () => {})

    // Cannot force Kinesis to return partial failures via HTTP.
    // This branch fires when response.FailedRecordCount > 0 and some records have ErrorCode set.
    // Per-record error codes are set by Kinesis based on real infrastructure conditions.
    it.skip('28 - handleMultiStatusResponse partial batch failure', () => {})

    // Cannot force Kinesis to return all records failed via HTTP.
    // Same reason as test 28 — requires Kinesis to return FailedRecordCount equal to total records.
    it.skip('29 - handleMultiStatusResponse all records failed', () => {})

    // Cannot trigger per-record error codes via HTTP.
    // The ERROR_CODE_STATUS_MAP maps 20 Kinesis/KMS/STS error codes to HTTP status codes.
    // These codes appear in response.Records[i].ErrorCode — set by Kinesis, not by the request.
    it.skip('30 - convertErrorCodeToStatus all 20 ERROR_CODE_STATUS_MAP entries', () => {})

    // Cannot trigger unknown error code via HTTP.
    // This path fires when Kinesis returns an unrecognized ErrorCode on a per-record failure.
    it.skip('31 - convertErrorCodeToStatus unknown code → 500', () => {})

    // Cannot trigger undefined error code via HTTP.
    // This path fires when Kinesis omits ErrorCode on a failed record (!code guard → return 500).
    it.skip('32 - convertErrorCodeToStatus undefined code → 500', () => {})

    // statsContext is not injected by the local serve environment.
    // Metrics are only observable in Segment deployed infrastructure (Datadog).
    it.skip('33 - stats metrics (statsContext.statsClient)', () => {})

    // Cannot force STS to return empty credentials via HTTP.
    // This guard fires when STS returns a successful AssumeRole response but with
    // missing AccessKeyId, SecretAccessKey, or SessionToken.
    it.skip('34 - getSTSCredentials returns empty credentials → 403', () => {})
  })
})
