/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContextFromDecorator, OperationDecorator } from './operationTracking'
import { EngageStats } from './EngageStats'
import { EngageLogger } from './EngageLogger'
import { IntegrationErrorWrapper } from './IntegrationErrorWrapper'

export const track = OperationDecorator.createDecoratorFactoryWithDefault(
  EngageLogger,
  EngageStats,
  IntegrationErrorWrapper
)

export type OperationContext = ContextFromDecorator<typeof track>
