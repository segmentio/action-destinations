/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContextFromDecorator, OperationDecorator } from '../../operationTracking'
import { MessageStats } from './MessageStats'
import { MessageLogger } from './MessageLogger'
import { IntegrationErrorWrapper } from './IntegrationErrorWrapper'

export const track = OperationDecorator.createDecoratorFactoryWithDefault(
  MessageLogger,
  MessageStats,
  IntegrationErrorWrapper
)

export type OperationContext = ContextFromDecorator<typeof track>
