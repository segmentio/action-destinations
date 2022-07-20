import { createTestEvent } from './create-test-event'
import { Destination } from './destination-kit'
import { mapValues } from './map-values'
import type { DestinationDefinition, StatsContext } from './destination-kit'
import type { JSONObject } from './json-object'
import type { SegmentEvent } from './segment-event'
import { AuthTokens } from './destination-kit/parse-settings'
import { Features } from './mapping-kit'
import { ExecuteDynamicFieldInput } from './destination-kit/action'

interface InputData<Settings> {
  /**
   * The Segment event. You can use `createTestEvent` if you want
   * to construct an event from partial data.
   */
  event?: Partial<SegmentEvent>
  /**
   * The raw input - this is what customers define. It may include
   * literal values as well as mapping-kit directives.
   */
  mapping?: JSONObject
  /**
   * The settings for a destination instance. Includes things like
   * `apiKey` or `subdomain`. Any fields that are used across all actions
   * in a destination.
   */
  settings?: Settings
  /**
   * Whether or not to use default mappings in the test.
   * Set to `false` or omit if you want to explicitly provide the raw input.
   * Set to `true` if you want to test the defaultMappings (along with any mapping passed in)
   */
  useDefaultMappings?: boolean
  auth?: AuthTokens
  /**
   * The features available in the request based on either customer workspaceID or sourceID;
   * Both `features` and `stats` are for internal Twilio/Segment use only.
   */
  features?: Features
  statsContext?: StatsContext
}

class TestDestination<T> extends Destination<T> {
  responses: Destination['responses'] = []

  constructor(destination: DestinationDefinition<T>) {
    super(destination)
  }

  async testDynamicField(action: string, fieldKey: string, data: ExecuteDynamicFieldInput<T, object>) {
    await super.executeDynamicField(action, fieldKey, data)

    const responses = this.responses
    this.responses = []

    return responses
  }

  /** Testing method that runs an action e2e while allowing slightly more flexible inputs */
  async testAction(
    action: string,
    { event, mapping, settings, useDefaultMappings, auth, features, statsContext }: InputData<T>
  ): Promise<Destination['responses']> {
    mapping = mapping ?? {}

    if (useDefaultMappings) {
      const fields = this.definition.actions[action].fields
      const defaultMappings = mapValues(fields, 'default')
      mapping = { ...defaultMappings, ...mapping } as JSONObject
    }

    await super.executeAction(action, {
      event: createTestEvent(event),
      mapping,
      settings: settings ?? ({} as T),
      auth,
      features: features ?? {},
      statsContext: statsContext ?? ({} as StatsContext)
    })

    const responses = this.responses
    this.responses = []

    return responses
  }

  async testBatchAction(
    action: string,
    {
      events,
      mapping,
      settings,
      useDefaultMappings,
      auth,
      features,
      statsContext
    }: Omit<InputData<T>, 'event'> & { events?: SegmentEvent[] }
  ): Promise<Destination['responses']> {
    mapping = mapping ?? {}

    if (useDefaultMappings) {
      const fields = this.definition.actions[action].fields
      const defaultMappings = mapValues(fields, 'default')
      mapping = { ...defaultMappings, ...mapping } as JSONObject
    }

    if (!events || !events.length) {
      events = [{ type: 'track' }]
    }

    await super.executeBatch(action, {
      events: events.map((event) => createTestEvent(event)),
      mapping,
      settings: settings ?? ({} as T),
      auth,
      features: features ?? {},
      statsContext: statsContext ?? ({} as StatsContext)
    })

    const responses = this.responses
    this.responses = []

    return responses
  }
}

export function createTestIntegration<T>(destination: DestinationDefinition<T>): TestDestination<T> {
  return new TestDestination(destination)
}
