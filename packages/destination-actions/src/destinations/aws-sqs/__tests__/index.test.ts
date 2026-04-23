import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('AWS SQS', () => {
  describe('destination definition', () => {
    it('has the correct name', () => {
      expect(Definition.name).toBe('AWS SQS')
    })

    it('has the correct slug', () => {
      expect(Definition.slug).toBe('actions-aws-sqs')
    })

    it('has cloud mode', () => {
      expect(Definition.mode).toBe('cloud')
    })

    it('has the send action', () => {
      expect(Definition.actions.send).toBeDefined()
    })

    it('has correct authentication fields', () => {
      const authFields = Definition.authentication?.fields
      expect(authFields?.iamRoleArn).toBeDefined()
      expect(authFields?.iamRoleArn.required).toBe(true)
      expect(authFields?.iamExternalId).toBeDefined()
      expect(authFields?.iamExternalId.type).toBe('password')
    })
  })

  describe('testAuthentication', () => {
    it('destination is defined', () => {
      expect(testDestination).toBeDefined()
    })
  })
})
