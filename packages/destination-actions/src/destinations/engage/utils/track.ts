/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
//import { ContextFromDecorator, OperationDecorator } from './operationTracking'
import { Hooks } from 'try-catch-finally-hooks'
import { EngageStats } from './EngageStats'
import { EngageLogger } from './EngageLogger'
import { IntegrationErrorWrapper } from './IntegrationErrorWrapper'


export const track = new Hooks().add(ctx=>{
})

// OperationDecorator.createDecoratorFactoryWithDefault(
//   EngageLogger,
//   EngageStats,
//   IntegrationErrorWrapper
// )

export type OperationContext = ContextFromDecorator<typeof track>
