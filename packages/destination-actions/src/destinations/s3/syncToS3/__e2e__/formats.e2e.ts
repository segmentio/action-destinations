/**
 * E2E fixtures exercising every supported delimiter and file extension.
 *
 * Delimiters: comma, pipe, tab, semicolon, colon. File extensions: csv, txt. Each fixture also
 * carries a value that CONTAINS the delimiter character, so the output verifies delimiter handling
 * end-to-end (values are wrapped in quotes by encodeString; column-name delimiters are stripped by
 * clean()). Success = the upload did not throw; inspect the bucket to confirm the separator and that
 * the embedded-delimiter value did not split into extra columns.
 */
import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import syncToS3 from '../index'

const FAILURE_HINT =
  'Ensure E2E_S3_* and AMAZON_S3_ACTIONS_* env vars are set and the IAM role can write to the bucket.'

const baseMapping = {
  ...defaultValues(syncToS3.fields),
  s3_aws_folder_name: 'e2e/formats/'
}

// A note value that embeds each delimiter, to prove quoting keeps it in one column.
const NOTE_WITH_DELIMITERS = 'a,b|c\td;e:f'

const formatEvent = (id: string) =>
  createE2EEvent('track', 'E2E Formats', {
    userId: id,
    properties: { email: `${id}@segment.com`, note: NOTE_WITH_DELIMITERS }
  })

const columns = {
  user_id: { '@path': '$.userId' },
  email: { '@path': '$.properties.email' },
  note: { '@path': '$.properties.note' }
}

const delimiterCases: Array<{ label: string; value: string }> = [
  { label: 'comma', value: ',' },
  { label: 'pipe', value: '|' },
  { label: 'tab', value: 'tab' },
  { label: 'semicolon', value: ';' },
  { label: 'colon', value: ':' }
]

const delimiterFixtures: E2EFixture[] = delimiterCases.map((d, i) => ({
  description: `Formats: ${d.label} delimiter (value contains all delimiters)`,
  subscribe: 'type = "track"',
  mode: 'single',
  mapping: {
    ...baseMapping,
    delimiter: d.value,
    file_extension: 'csv',
    filename_prefix: `delim-${d.label}`,
    columns
  },
  event: formatEvent(`e2e-s3-fmt-delim-${i + 1}`),
  expect: { status: 'success' },
  verboseFailureHint: FAILURE_HINT
}))

const extensionCases = ['csv', 'txt']

const extensionFixtures: E2EFixture[] = extensionCases.map((ext, i) => ({
  description: `Formats: ${ext} file extension`,
  subscribe: 'type = "track"',
  mode: 'single',
  mapping: {
    ...baseMapping,
    delimiter: ',',
    file_extension: ext,
    filename_prefix: `ext-${ext}`,
    columns
  },
  event: formatEvent(`e2e-s3-fmt-ext-${i + 1}`),
  expect: { status: 'success' },
  verboseFailureHint: FAILURE_HINT
}))

const fixtures: E2EFixture[] = [...delimiterFixtures, ...extensionFixtures]

export default fixtures
