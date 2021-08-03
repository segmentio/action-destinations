# Mapping Kit

Mapping Kit is a library for mapping and transforming JSON payloads. It exposes a function that
accepts a mapping configuration object and a payload object and outputs a mapped and transformed
payload. A mapping configuration is a mixture of raw values (values that appear in the output
payload as they appear in the mapping configuration) and directives, which can fetch and transform
data from the input payload.

For example:

```json
Mapping:

{
  "name": "Mr. Rogers",
  "neighborhood": { "@path": "$.properties.neighborhood" },
  "greeting": { "@template": "Won't you be my {{properties.noun}}?" }
}

Input:

{
  "type": "track",
  "event": "Sweater On",
  "context": {
    "library": {
      "name": "analytics.js",
      "version": "2.11.1"
    }
  },
  "properties": {
    "neighborhood": "Latrobe",
    "noun": "neighbor",
    "sweaterColor": "red"
  }
}

Output:

{
  "name": "Mr. Rogers",
  "neighborhood": "Latrobe",
  "greeting": "Won't you be my neighbor?"
}
```

## Table of contents

<!-- ./node_modules/.bin/markdown-toc -i ./src/lib/mapping-kit/README.md -->

<!-- toc -->

- [Usage](#usage)
- [Terms](#terms)
- [Mixing raw values and directives](#mixing-raw-values-and-directives)
- [Validation](#validation)
- [Options](#options)
  - [merge](#merge)
- [Removing values from object](#removing-values-from-object)
- [Directives](#directives)
  - [@if](#if)
  - [@path](#path)
  - [@template](#template)
  - [@literal](#literal)

<!-- tocstop -->

## Usage

```ts
import { transform } from '../mapping-kit'

const mapping = { '@path': '$.foo.bar' }
const input = { foo: { bar: 'Hello!' } }

const output = transform(mapping, input)
// => "Hello!"
```

## Terms

In Mapping Kit, there are only two kinds of values: **raw values** and **directives**. Raw values
can be any JSON value and Mapping Kit will return them in the output payload untouched:

```json
42

"Hello, world!"

{ "foo": "bar" }

["product123", "product456"]
```

Directives are objects with a single @-prefixed key that tell Mapping Kit to fetch data from the
input payload or transform some data:

```json
{ "@path": "$.properties.name" }

{ "@template": "Hello there, {{traits.name}}" }
```

In this document, the act of converting a directive to its final raw value is called "resolving" the
directive.

## Mixing raw values and directives

Directives and raw values can be mixed to create complex mappings. For example:

```json
Mapping:

{
  "action": "create",
  "userId": {
    "@path": "$.traits.email"
  },
  "userProperties": {
    "@path": "$.traits"
  }
}

Input:

{
  "traits": {
    "name": "Peter Gibbons",
    "email": "peter@example.com",
    "plan": "premium",
    "logins": 5,
    "address": {
      "street": "6th St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94103",
      "country": "USA"
    }
  }
}


Output:

{
  "action": "create",
  "userId": "peter@example.com",
  "userProperties": {
    "name": "Peter Gibbons",
    "email": "peter@example.com",
    "plan": "premium",
    "logins": 5,
    "address": {
      "street": "6th St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94103",
      "country": "USA"
    }
  }
}
```

A directive may not, however, be mixed in at the same level as a raw value:

```json
Invalid:

{
  "foo": "bar",
  "@path": "$.properties.biz"
}

Valid:

{
  "foo": "bar",
  "baz": { "@path": "$.properties.biz" }
}
```

And a directive may only have one @-prefixed directive in it:

```json
Invalid:

{
  "@path": "$.foo.bar",
  "@template": "{{biz.baz}"
}

Valid:

{
  "foo": { "@path": "$.foo.bar" },
  "baz": {
    "@template": "{{biz.baz}}"
  }
}
```

## Validation

Mapping configurations can be validated using JSON Schema. The [test
suite][schema.test.js] is a good source-of-truth for current implementation behavior.

[schema.test.js]: https://github.com/segmentio/fab-5-engine/blob/master/packages/destination-actions/src/lib/mapping-kit/__tests__

## Options

Options can be passed to the `transform()` function as the third parameter:

```js
const output = transform(mapping, input, options)
```

Available options:

```js
{
  merge: true // default false
}
```

### merge

If true, `merge` will cause the mapped value to be merged onto the input payload. This is useful
when you only want to map/transform a small number of fields:

```json
Input:

{
  "a": {
    "b": 1
  },
  "c": 2
}

Options:

{
  "merge": true
}

Mappings:

{}
=>
{
  "a": {
    "b": 1
  },
  "c": 2
}

{
  "a": 3
}
=>
{
  "a": 3,
  "c": 2
}

{
  "a": {
    "c": 3
  }
}
=>
{
  "a": {
    "b": 1,
    "c": 3
  },
  "c": 2
}
```

## Removing values from object

`undefined` values in objects are removed from the mapped output while `null` is not:

```json
Input:

{
  "a": 1
}

Mappings:

{
  "foo": {
    "@path": "$.a"
  },
  "bar": {
    "@path": "$.b"
  },
  "baz": null
}
=>
{
  "foo": 1,
  "baz": null
}
```

## Directives

### @if

The @if directive resolves to different values based on a given conditional. It must have at least
one conditional (see below) and one branch ("then" or "else").

The supported conditional values are:

- "exists": If the given value is not undefined or null, the @if directive resolves to the "then"
  value. Otherwise, the "else" value is used.

```json
Input:

{
  "a": "cool",
  "b": true
}

Mappings:

{
  "@if": {
    "exists": { "@path": "$.a" },
    "then": "yep",
    "else": "nope"
  }
}
=>
"yep"

{
  "@if": {
    "exists": { "@path": "$.nope" },
    "then": "yep",
    "else": "nope"
  }
}
=>
"nope"
```

If "then" or "else" are not defined and the conditional indicates that their value should be used,
the field will not appear in the resolved output. This is useful for including a field only if it
(or some other field) exists:

```json
Input:

{
  "a": "cool"
}

Mappings:

{
  "foo-exists": {
    "@if": {
      "exists": { "@path": "$.foo" },
      "then": true
    }
  }
}
=>
{}

{
  "a": {
    "@if": {
      "exists": { "@path": "$.oops" },
      "then": { "@path": "$.a" }
    }
  }
}
=>
{}
```

### @path

The @path directive resolves to the value at the given path. @path supports basic dot notation. Like JSONPath, you can include or omit the leading `$.`

```json
Input:

{
  "foo": {
    "bar": 42,
    "baz": [{ "num": 1 }, { "num": 2 }]
  },
  "hello": "world"
}

Mappings:

{ "@path": "$.hello" } => "world"

{ "@path": "$.foo.bar" } => 42

{ "@path": "$.foo.baz[0].num" } => 1
```

### @template

The @template directive resolves to a string replacing curly brace `{{}}` placeholders.

```json
Input:

{
  "traits": {
    "name": "Mr. Rogers"
  },
  "userId": "abc123"
}

Mappings:

{ "@template": "Hello, {{traits.name}}!" } => "Hello, Mr. Rogers!"

{ "@template": "Hello, {{traits.fullName}}!" } => "Hello, !"

{ "@template": "{{traits.name}} ({{userId}})" } => "Mr.Rogers (abc123)"
```

### @literal

The @literal directive resolves to the value with no modification. This is needed primarily to work around literal values being interpreted incorrectly as invalid templates.

```json
Input:
n/a

Mappings:
{ "@literal": true } => true
```
