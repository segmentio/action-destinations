# @segment/ajv-human-errors

> Human-readable error messages for [Ajv](https://ajv.js.org) (Another JSON Schema Validator).

By default, Ajv error messages leave a little bit to be desired. ajv-human-errors provides an aggregate Error object that holds Ajv validation errors that are more easily readable by humans. For example, ajv-human-errors changes "must NOT have additional properties" to "The root value has an unexpected property, c, which is not in the list of allowed properties (a, d)."

You can also override the error message entirely using the "errorMessage" schema keyword, like you can with [ajv-errors](https://github.com/ajv-validator/ajv-errors) (see ["Schema Options"](#schema-options)).

The following Ajv options must be set to `true` for `ajv-human-errors` to work with the errors returned by Ajv:

- `allErrors`
- `verbose`

The following features of JSON Schema are not yet implemented (but will return their "raw" Ajv error messages):

- patternProperties
- allOf
- oneOf
- Nested array schemas
- const
- if/then/else
- contentEncoding/contentMediaType

# Install

```console
$ yarn add @segment/ajv-human-error
```

or

```console
$ npm install @segment/ajv-human-error
```

# Usage

```ts
import Ajv from 'ajv'
import { AggregateAjvError } from '@segment/ajv-human-errors'

const ajv = new Ajv({
  allErrors: true,
  verbose: true
})

ajv.validate({ title: 'Bag of Bytes', type: 'string' }, 1234)

const errors = new AggregateAjvError(ajv.errors)
console.log(errors.message)
// 'Bag of Bytes should be a string but it was a number.'
console.log(errors.map(({ message }) => message))
// ['Bag of Bytes should be a string but it was a number.']
```

The `AggregateAjvError` object can be passed to `JSON.stringify()`:

```json
[
  {
    "message": "The value at .arr should be unique but elements 1 and 4 are the same.",
    "path": "$.arr",
    "pointer": "/arr",
    "data": [0, 1, 2, 0, 1]
  }
  // ...
]
```

# API

AggregateAjvError is an Iterable that yields AjvError errors:

```ts
import { AggregateAjvError } from '@segment/ajv-human-errors'

const errors = new AggregateAjvError(ajv.errors)

const messages = errors.map(({ message }) => message)

// or

const messages = []
for (const error of errors) {
  messages.push(error.message)
}
```

Each AjvError instance has the following properties:

- `pointer`: JSON Pointer to the field that this error refers to.

- `path`: JSON Path to the field that this error refers to.

- `message`: Human-readable error message.

- `original`: (Only if `includeOriginalError` option is set) Original Ajv error object.

- `data`: (Only if `includeData` option is set) Value that value that failed validation. Useful for showing users what, exactly, was wrong without embedding entire values in the error message.

These fields are also available in the JSON form:

```ts
const { AggregateAjvError } = require('@segment/ajv-human-errors')

const errors = new AggregateAjvError(ajv.errors)

console.log(errors[0].toJSON())
```

which will log this:

```ts
{
  message: 'The value at /arr should be unique but elements 1 and 4 are the same.',
  path: '$.arr',
  pointer: '/arr',
  original: { ... },
  data: [0, 1, 2, 0, 1]
}
```

# Options

The `AggregateAjvError` constructor accepts the following options:

- `fieldLabels` (default: `'title'`) Change the labels used for fields. Allowed values:

  - `'js'` JavaScript object accessor notation. Example: "The value at .for.bar should be a number
    but it was a string."

  - `'jsonPath'` [JSON Path](https://goessner.net/articles/JsonPath/) notation. Example: "The
    value at $.foo.bar should be a number but it was a string."

  - `'jsonPointer'` [JSON Pointer](https://tools.ietf.org/html/rfc6901) notation. Example: "The
    value at /foo/bar should be a number but it was a string."

  - `'title'` Uses the `title` property of the schema rule that failed validation. If your schema
    is:

    ```json
    {
      "title": "Bag of values",
      "type": "object"
    }
    ```

    Then the resulting error message would look like: "Bag of values should be an object but it was an array."

- `includeOriginalError` (default: false) Include the original Ajv error object on the `data` property of each error in the `AggregateAjvError` instance:

  ```ts
  const errors = new AggregateAjvError(ajv.errors, { includeOriginalError: true })
  errors.forEach(({ original }) => console.log(original))
  ```

  output:

  ```ts
  {
    params: { ... },
    parentSchema: { ... },
    schema: '...',
    schemaPath: '...',
    ...
  }
  ```

- `includeData` (default: false) Include the value of the field that failed validation on the `data`
  property of each error in the `AggregateAjvError` instance.

  ```ts
  const errors = new AggregateAjvError(ajv.errors, { includeOriginalError: true })
  errors.forEach(({ data }) => console.log(data))
  ```

  output:

  ```ts
  'foobar'
  ```

# Schema Options

If you want to override an error message entirely, you can set an "errorMessage" keyword in your
JSON Schema. For example, this schema:

```json
{
  "type": "string",
  "errorMessage": "should be a bag of bytes"
}
```

Returns this error message when validating a non-string object:

```ts
'The root value should be a bag of bytes.'
```

# License

MIT License

Copyright (c) 2024 Segment

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

All third party contributors acknowledge that any contributions they provide will be made under the same open source license that the open source project is provided under.
