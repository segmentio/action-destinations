import { ErrorObject } from 'ajv'

import type { HumanError, Options } from './entities'
import { getMessage } from './formatting'
import { capitalize, jsonPath } from './util'

const defaultOpts: Options = {
  fieldLabels: 'title',
  includeOriginalError: false,
  includeData: false
}

export class AjvError extends Error {
  private options: Options = {}
  pointer: ErrorObject['instancePath']
  path: string
  redundant = false
  data: ErrorObject['data']
  original?: ErrorObject

  // https://github.com/ajv-validator/ajv#validation-_errors
  constructor(ajvErr: ErrorObject, options: Options = {}) {
    super()

    this.options = {
      ...defaultOpts,
      ...options
    }

    this.pointer = ajvErr.instancePath
    this.path = jsonPath(ajvErr.instancePath)

    const message = getMessage(ajvErr, this.options)

    // TODO
    // we need a better way of indicating that an error should be filtered out
    // (e.g. sub-_errors for 'propertyNames' validations on object properties)
    if (message === null) {
      this.redundant = true
      return
    }

    this.message = `${capitalize(message)}.`

    if (this.options.includeOriginalError) {
      this.original = ajvErr
    }
    if (this.options.includeData) {
      this.data = ajvErr.data
    }
  }

  toJSON() {
    const humanError: HumanError = {
      path: this.path,
      pointer: this.pointer,
      message: this.message
    }

    if (this.options.includeOriginalError) {
      humanError.original = this.original
    }
    if (this.options.includeData) {
      humanError.data = this.data
    }

    return humanError
  }
}

export class AggregateAjvError extends Error {
  private errors: AjvError[]

  constructor(ajvErrors: ErrorObject[], opts: Options = {}) {
    super()
    this.name = 'AggregateAjvError'
    this.errors = (ajvErrors ?? []).map((error) => new AjvError(error, opts)).filter((error) => !error.redundant)
    this.message = this.errors.map((error) => error.message).join(' ')
  }

  toJSON() {
    return this.errors.map((error) => error.toJSON())
  }

  *[Symbol.iterator]() {
    for (const err of this.errors) {
      yield err
    }
  }
}
