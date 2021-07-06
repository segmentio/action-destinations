const util = require('./util')

const defaultOpts = {
  fieldLabels: 'title', // js, jsonPath, jsonPointer, title
  includeOriginalError: false,
  includeData: false
}

const formatLabels = {
  'date-time': 'date and time',
  time: 'time',
  date: 'date',
  email: 'email address',
  hostname: 'hostname',
  ipv4: 'IPv4 address',
  ipv6: 'IPv6 address',
  uri: 'URI',
  'uri-reference': 'URI Reference',
  'uri-template': 'URI-template',
  'json-pointer': 'JSON Pointer',
  'relative-json-pointer': 'relative JSON Pointer',
  regex: 'regular expression'
}

class AjvError extends Error {
  // https://github.com/ajv-validator/ajv#validation-_errors
  constructor (ajvErr, opts = {}) {
    super()

    this._opts = {
      ...defaultOpts,
      ...opts
    }

    this.pointer = ajvErr.dataPath
    this.path = util.jsonPath(ajvErr.dataPath)

    const message = this._message(ajvErr)

    // TODO we need a better way of indicating that an error should be filtered out (e.g.
    // sub-_errors for 'propertyNames' validations on object properties)
    if (message === null) {
      this.redundant = true
      return
    }

    this.message = util.capitalize(message) + '.'

    if (this._opts.includeOriginalError) this.original = ajvErr
    if (this._opts.includeData) this.data = ajvErr.data
  }

  toJSON () {
    const v = {
      path: this.path,
      pointer: this.pointer,
      message: this.message
    }

    if (this._opts.includeOriginalError) v.original = this.original
    if (this._opts.includeData) v.data = this.data

    return v
  }

  _message (ajvErr) {
    if (ajvErr.parentSchema.errorMessage) {
      return `${this._fieldPreamble(ajvErr)} ${ajvErr.parentSchema.errorMessage}`
    }

    const messageBuilder = this[`_buildMessage_${ajvErr.keyword}`]
    if (typeof messageBuilder === 'function') {
      return messageBuilder.bind(this)(ajvErr)
    }

    // Default message
    return `${this._fieldPreamble(ajvErr)} ${ajvErr.message}`
  }

  _fieldPreamble (ajvErr) {
    switch (this._opts.fieldLabels) {
      case 'js':
        if (ajvErr.dataPath === '') return 'the root value'
        return `the value at ${util.jsonPath(ajvErr.dataPath).replace(/^\$/, '')}`

      case 'jsonPath':
        return `the value at ${util.jsonPath(ajvErr.dataPath)}`

      case 'jsonPointer':
        if (ajvErr.dataPath === '') return 'the root value'
        return `the value at ${ajvErr.dataPath}`

      case 'title':
        if (ajvErr.parentSchema.title) return ajvErr.parentSchema.title
        if (ajvErr.dataPath === '') return 'the root value'
        return `the value at ${ajvErr.dataPath}`

      default:
        throw new Error(`invalid fieldLabels value: ${this._opts.fieldLabels}`)
    }
  }

  /* eslint-disable camelcase */

  // -- base keywords

  _buildMessage_enum (err) {
    const allowed = util.humanizeList(err.params.allowedValues.map(JSON.stringify), 'or')

    return `${this._fieldPreamble(err)} should be one of: ${allowed}`
  }

  _buildMessage_type (err) {
    const expectType = util.humanizeList(err.params.type.split(','), 'or')
    const gotType = util.humanizeTypeOf(err.data)

    return `${this._fieldPreamble(err)} should be ${util.indefiniteArticle(expectType)} ${expectType} but it was ${gotType}`
  }

  // -- strings

  _buildMessage_minLength (err) {
    const limit = err.params.limit
    const charsLimit = util.pluralize('character', limit)
    const actual = err.data.length
    const charsActual = util.pluralize('character', actual)

    return `${this._fieldPreamble(err)} should be ${limit} ${charsLimit} or more but it was ${actual} ${charsActual}`
  }

  _buildMessage_maxLength (err) {
    const limit = err.params.limit
    const charsLimit = util.pluralize('character', limit)
    const actual = err.data.length
    const charsActual = util.pluralize('character', actual)

    return `${this._fieldPreamble(err)} should be ${limit} ${charsLimit} or fewer but it was ${actual} ${charsActual}`
  }

  _buildMessage_pattern (err) {
    if (err.schemaPath.endsWith('propertyNames/pattern')) return null

    const patternLabel = err.parentSchema.patternLabel

    if (patternLabel) {
      return `${this._fieldPreamble(err)} should be ${patternLabel} but it was not`
    } else {
      return `${this._fieldPreamble(err)} is an invalid string`
    }
  }

  _buildMessage_format (err) {
    const label = formatLabels[err.params.format] || err.params.format

    return `${this._fieldPreamble(err)} should be a valid ${label} string but it was not`
  }

  // -- numbers

  _buildMessage_multipleOf (err) {
    return `${this._fieldPreamble(err)} should be a multiple of ${err.params.multipleOf}`
  }

  _buildMessage_minimum (err) {
    return `${this._fieldPreamble(err)} should be equal to or greater than ${err.params.limit}`
  }

  _buildMessage_exclusiveMinimum (err) {
    return `${this._fieldPreamble(err)} should be greater than ${err.params.limit}`
  }

  _buildMessage_maximum (err) {
    return `${this._fieldPreamble(err)} should be equal to or less than ${err.params.limit}`
  }

  _buildMessage_exclusiveMaximum (err) {
    return `${this._fieldPreamble(err)} should be less than ${err.params.limit}`
  }

  // -- objects

  _buildMessage_additionalProperties (err) {
    const allowed = Object.keys(err.parentSchema.properties).join(', ')
    const found = err.params.additionalProperty

    return `${this._fieldPreamble(err)} has an unexpected property, ${found}, which is not in the list of allowed properties (${allowed})`
  }

  _buildMessage_required (err) {
    const missingField = err.params.missingProperty

    return `${this._fieldPreamble(err)} is missing the required field '${missingField}'`
  }

  _buildMessage_propertyNames (err) {
    return `${this._fieldPreamble(err)} has an invalid property name ${JSON.stringify(err.params.propertyName)}`
  }

  _buildMessage_minProperties (err) {
    const expected = err.params.limit
    const actual = Object.keys(err.data).length
    return `${this._fieldPreamble(err)} should have ${expected} or more properties but it has ${actual}`
  }

  _buildMessage_maxProperties (err) {
    const expected = err.params.limit
    const actual = Object.keys(err.data).length
    return `${this._fieldPreamble(err)} should have ${expected} or fewer properties but it has ${actual}`
  }

  _buildMessage_dependencies (err) {
    const prop = err.params.property
    const missing = err.params.missingProperty

    return `${this._fieldPreamble(err)} should have property ${missing} when ${prop} is present`
  }

  // -- arrays

  _buildMessage_minItems (err) {
    const min = err.params.limit
    const actual = err.data.length
    return `${this._fieldPreamble(err)} should have ${min} or more items but it has ${actual}`
  }

  _buildMessage_maxItems (err) {
    const max = err.params.limit
    const actual = err.data.length
    return `${this._fieldPreamble(err)} should have ${max} or fewer items but it has ${actual}`
  }

  _buildMessage_uniqueItems (err) {
    const { i, j } = err.params
    return `${this._fieldPreamble(err)} should be unique but elements ${j} and ${i} are the same`
  }
}

module.exports.AjvError = AjvError

class AggregateAjvError extends Error {
  constructor (ajvErrors, opts = {}) {
    super()

    this.name = 'AggregateAjvError'

    this._errors = ajvErrors
      .map(e => new AjvError(e, opts))
      .filter(e => !e.redundant)

    this.message = this._errors.map(e => e.message).join(' ')
  }

  toJSON () {
    return this._errors.map(e => e.toJSON())
  }

  * [Symbol.iterator] () {
    for (const err of this._errors) {
      yield err
    }
  }
}

module.exports.AggregateAjvError = AggregateAjvError
