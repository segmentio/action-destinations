import Definition from '../index'
import { createTestIntegration } from '@segment/actions-core'

const testDestination = createTestIntegration(Definition)

test('extendRequest should set timeout correctly', () => {
  const requestConfig = testDestination?.extendRequest?.({} as any)
  expect(requestConfig?.timeout).toBeGreaterThanOrEqual(30000)
})

test('authentication should contain valid AWS region choices', () => {
  const awsRegionField = testDestination.authentication?.fields?.awsRegion
  expect(awsRegionField).toBeDefined()
  expect(awsRegionField?.choices).toEqual([
    { label: 'us-east-1', value: 'us-east-1' },
    { label: 'us-east-2', value: 'us-east-2' },
    { label: 'us-west-1', value: 'us-west-1' },
    { label: 'us-west-2', value: 'us-west-2' },
    { label: 'eu-west-1', value: 'eu-west-1' },
    { label: 'eu-west-2', value: 'eu-west-2' },
    { label: 'eu-west-3', value: 'eu-west-3' },
    { label: 'ap-southeast-1', value: 'ap-southeast-1' },
    { label: 'ap-southeast-2', value: 'ap-southeast-2' },
    { label: 'sa-east-1', value: 'sa-east-1' },
    { label: 'ap-northeast-1', value: 'ap-northeast-1' },
    { label: 'ap-northeast-2', value: 'ap-northeast-2' },
    { label: 'ap-south-1', value: 'ap-south-1' },
    { label: 'ca-central-1', value: 'ca-central-1' },
    { label: 'eu-central-1', value: 'eu-central-1' }
  ])
})

test('authentication should contain valid partnerEventSourceName choices', () => {
  const partnerEventSourceField = testDestination.authentication?.fields?.partnerEventSourceName
  expect(partnerEventSourceField).toBeDefined()
  expect(partnerEventSourceField?.choices).toEqual([
    { label: 'segment.com', value: 'aws.partner/segment.com' },
    { label: 'segment.com.test', value: 'aws.partner/segment.com.test' }
  ])
})

test('createPartnerEventSource should default to false', () => {
  const createPartnerEventSourceField = testDestination.authentication?.fields?.createPartnerEventSource
  expect(createPartnerEventSourceField).toBeDefined()
  expect(createPartnerEventSourceField?.default).toBe(false)
})

test('destination should contain send action', () => {
  expect(testDestination.actions).toHaveProperty('send')
})
