import { Destination } from './destination-kit'
import type { DestinationDefinition } from './destination-kit'
import type { JSONObject } from './json-object'
import type { SegmentEvent } from './segment-event'
import { AuthTokens } from './destination-kit/parse-settings'
interface InputData<Settings> {
  event?: Partial<SegmentEvent>
  mapping?: JSONObject
  settings?: Settings
  useDefaultMappings?: boolean
  auth?: AuthTokens
}
declare class TestDestination<T> extends Destination<T> {
  responses: Destination['responses']
  constructor(destination: DestinationDefinition<T>)
  testAction(
    action: string,
    { event, mapping, settings, useDefaultMappings, auth }: InputData<T>
  ): Promise<Destination['responses']>
  testBatchAction(
    action: string,
    {
      events,
      mapping,
      settings,
      useDefaultMappings,
      auth
    }: Omit<InputData<T>, 'event'> & {
      events?: SegmentEvent[]
    }
  ): Promise<Destination['responses']>
}
export declare function createTestIntegration<T>(destination: DestinationDefinition<T>): TestDestination<T>
export {}
