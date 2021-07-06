import { EventEmitter } from 'events'
import { JSONObject } from '../json-object'

export interface StepResult {
  output?: JSONObject | string | null | undefined
  error?: JSONObject | null
}

export interface ExecuteInput<Settings, Payload> {
  /** The subscription mapping definition */
  readonly mapping?: JSONObject
  /** The global destination settings */
  readonly settings: Settings
  /** The transformed input data, based on `mapping` + `event` */
  payload: Payload
  /** The ids from cached requests */
  cachedFields: { [key: string]: string | null | undefined }
  /** The page used in dynamic field requests */
  page?: string
}

/**
 * Step is the base class for all discrete execution steps. It handles executing the step, logging,
 * catching errors, and returning a result object.
 */
export class Step<Settings, Payload> extends EventEmitter {
  executeStep?(data: ExecuteInput<Settings, Payload>): Promise<JSONObject | string | null | undefined>

  async execute(data: ExecuteInput<Settings, Payload>): Promise<StepResult> {
    const result: StepResult = {
      output: null,
      error: null
    }

    if (!this.executeStep) {
      return result
    }

    try {
      result.output = await this.executeStep(data)
    } catch (e) {
      result.error = e
    }

    return result
  }
}

/**
 * Steps is a list of one or more Step instances that can be executed in-order.
 */
export class Steps<Settings, Payload> {
  steps: Step<Settings, Payload>[]

  constructor() {
    this.steps = []
  }

  push(step: Step<Settings, Payload>): void {
    this.steps.push(step)
  }

  async execute(data: ExecuteInput<Settings, Payload>): Promise<StepResult[]> {
    if (this.steps.length === 0) {
      throw new Error('no steps defined')
    }

    const results: StepResult[] = []

    for (const step of this.steps) {
      const result = await step.execute(data)

      results.push(result)

      if (result.error) {
        break
      }
    }

    return results
  }
}
