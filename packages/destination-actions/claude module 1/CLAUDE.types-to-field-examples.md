# Field Definitions

An Action's Field Definitions can only be defined once the API being called is understood, and specifically only after the `JSON Request Interface` has been defined in the types.ts file for the Action.

The examples in this document will start off simple and will get more complex.
The examples below will contain comments.
The examples below will define each field separately, and will include the Typescript type named `InputField`.
The examples below will use the interface name DestinationJSON. This represends the `JSON Request Interface` for the Action.
Each example will define fields which could be used to select data from a Segment track(), page(), screen(), identify() or group() JSON payload, which would then be transformed into an object of type DestinationJSON in the perform() or performBatch() functions.

# Field Definitions general design rules

1. Don't define too many fields as it will result in a cluttered user interface. Instead, try to merge individual simple type fields (string, number, integer, boolean) together into a single object field.
2. Only merge fields into an object field if the fields have something in common. For example, if they all collect user identifiers, or if they all relate to user traits, or if they all relate to a product's details. There's no point merging multiple fields together then they each serve a completely different purpose.
3. Default mappings should be used for every field, specially if the field can be correlated back to a Segment standard trait or property from the identify spec or ecommerce spec.
4. Always specify if a field is required or optional.
5. Always specify if a sub field is required of optional.
6. For numeric fields, figure out if the field should have a type of `integer` or `number`, depending on what the field is called. For example a field named `age` should be of type `integer`, while a field named `price` should be of type `number`.
7. For Actions designed to handle track() event payloads, always use the `@if` conditional statement to set two default paths, one to `$.context.traits.field_name` and the other to `$.properties.field_name`. If the Action is designed to handle identify() payloads then just map the user trait to `$.traits.field_name`.

# Handling Deeply Nested Interfaces

When dealing with interfaces that have more than two levels of nesting, follow these guidelines:

1. Flatten the structure by creating separate fields
2. Use object fields to group related properties
3. Avoid creating fields that are more than 2 levels deep
4. Never nest an object field within another object field

## Bad Example (Too Nested):

```typescript
export const deeplyNestedField: InputField = {
  label: 'Deeply Nested Field',
  type: 'object',
  properties: {
    level1: {
      type: 'object',
      properties: {
        level2: {
          type: 'object',
          properties: {
            level3: {
              // This is NOT allowed
              type: 'string'
            }
          }
        }
      }
    }
  }
}
```

Good Example (Flattened):

```typescript
export const flattenedFields: InputField = {
  label: 'Grouped Fields',
  type: 'object',
  properties: {
    primaryField: {
      type: 'string'
    },
    secondaryFields: {
      type: 'object',
      additionalProperties: true
    }
  }
}
```

## Example 1 - a string field

```typescript
interface DestinationJSON {
  /**
   * Name of the analytics event triggered
   */
  eventName: string
}
```

In this example the `JSON Request Interface` is super simple, and consists of an object containing single required field named `eventName`.
We can see that the type for `eventName` is string, and we can see that it is a required field.
We also know that Segment track() events have an event name at the `$.event` location in the payload, so we will provide a default mapping to that location.

The field definition would be as follows:

```typescript
export const eventName: InputField = {
  label: 'Event Name',
  description: 'Name of the analytics event triggered',
  type: 'string',
  required: true,
  default: { '@path': '$.event' }
}
```

## Example 2 - a boolean field

```typescript
interface DestinationJSON {
  /**
   * Indicates if the user is subscribed or not. true for subscribed, false for not subscribed
   */
  isSubscribed?: boolean
}
```

In this example the `JSON Request Interface` is super simple, and consists of an object containing single optional field named `isSubscribed`.
We can see that the type for the field is boolean, and we can see that the field is optional.
We can infer that `isSubscribed` is a user trait, as it relates to a user profile, so that should inform the detault mapping.
We also know that Segment identify() events contain user traits at this location `$.traits` and that track events can contain user traits at either of these 2 locations, `$.context.traits` or `$.properties`.
Note that Segment doesn't have a predefined mapping for a user trait for being subscribed, so we can invent one, as long as we stick with the `snake_case` trait naming convention.

If we were referencing data from a identify() call we would do the following:

```typescript
export const isSubscribed: InputField = {
  label: 'Is Subscribed',
  description: 'Indicates if the user is subscribed or not. true for subscribed, false for not subscribed',
  type: 'boolean',
  required: false,
  default: { '@path': '$.traits.is_subscribed' }
}
```

If we were referencing data from a track() call we would do the following:

```typescript
export const isSubscribed: InputField = {
  label: 'Is Subscribed',
  description: 'Indicates if the user is subscribed or not. true for subscribed, false for not subscribed',
  type: 'boolean',
  required: false,
  default: {
    '@if': {
      exists: { '@path': '$.context.traits.is_subscribed' },
      then: { '@path': '$.context.traits.is_subscribed' },
      else: { '@path': '$.properties.is_subscribed' }
    }
  }
}
```

In this example we introduced the `@if` conditional mapping statement. This allows us to specify 2 default mapping locations in the Segment payload.
Note that `@if` conditional mapping statements cannot be nested. You cannot define an `@if` within an `@if`.

## Example 3 - a numeric field

Again, another super simple example. This time of a numeric field.
We can see that the field is optional.
We can also infer that the field relates to a user trait.
We know that there is no predefined user traits to denote the price of a user's last purchase, so we can invent a default mapping as long as we stick to the `snake_case` format.

```typescript
interface DestinationJSON {
  /**
   * The price paid by the user for their last purchase
   */
  lastProductPurchasePrice?: number
}
```

If we were referencing data from a identify() call we would do the following:

```typescript
export const lastProductPurchasePrice: InputField = {
  label: 'Last Purchase Price',
  description: 'The price paid by the user for their last purchase',
  type: 'number',
  required: false,
  default: { '@path': '$.traits.last_purchase_price' }
}
```

If we were referencing data from a track() call we would do the following:

```typescript
export const isSubscribed: InputField = {
  label: 'Last Purchase Price',
  description: 'The price paid by the user for their last purchase',
  type: 'number',
  required: false,
  default: {
    '@if': {
      exists: { '@path': '$.context.traits.last_purchase_price' },
      then: { '@path': '$.context.traits.last_purchase_price' },
      else: { '@path': '$.properties.last_purchase_price' }
    }
  }
}
```

## Example 4 - a numeric integer field

Again, another super simple example. This time of a numeric field.
The type is defined as `number`, however we know that `age` is a whole number, so we'll set the type of the Field to be `integer`.
We can see that the field is required.
We can also infer that the field relates to a user trait.
We know that there is a prefefined user trait for `age`, so we will map to that location in the payload.

```typescript
interface DestinationJSON {
  /**
   * The age of the user
   */
  userAge?: number
}
```

If we were referencing data from a identify() call we would do the following:

```typescript
export const userAge: InputField = {
  label: 'User Age',
  description: 'The age of the user',
  type: 'integer',
  required: true,
  default: { '@path': '$.traits.age' }
}
```

If we were referencing data from a track() call we would do the following:

```typescript
export const userAge: InputField = {
  label: 'User Age',
  description: 'The age of the user',
  type: 'integer',
  required: true,
  default: {
    '@if': {
      exists: { '@path': '$.context.traits.age' },
      then: { '@path': '$.context.traits.age' },
      else: { '@path': '$.properties.age' }
    }
  }
}
```

## Example 5 - an object field

Object fields are more complex.
Below you can see a typescript object type defined.
Object fields allow for zero of more Sub fields to be defined.
in this example each sub field must have `label`, `description`, `required` and `type` attributes defined.
Sub fields do not define their own default mapping. Instead, the default mappings for sub fields are defined at the main object field level.

In the example bwlow, the entire object field is optional, as are the sub fields.
The userAddress object will only accept values for the 5 predefined sub fields. This is configured via the `additionalProperties: false` attribute. Because of this attribute, the customer cannot send additional information in the object field apart from these sub fields.

We can infer that this object field is for a user trait, as it's relevant to a user and not to a discrete event.
Note that `address` is a standard Segment user trait, so we should configure detault mappings accordingly.

```typescript
interface DestinationJSON {
  /**
   * The user's address
   */
  userAddress?: {
    city?: string
    country?: string
    postal_code?: string
    state?: string
    street?: string
  }
}
```

If we were referencing data from a identify() call we would do the following:

```typescript
export const address_identify: InputField = {
  label: 'User Address',
  description: "The user's address",
  type: 'object',
  required: false,
  additionalProperties: false,
  properties: {
    city: {
      label: 'City',
      description: 'User city',
      type: 'string'
      required: false
    },
    country: {
      label: 'Country',
      description: 'User country',
      type: 'string',
      required: false
    },
    postal_code: {
      label: 'Postal Code',
      description: 'User Postal Code',
      type: 'string',
      required: false
    },
    state: {
      label: 'State',
      description: 'User State',
      type: 'string',
      required: false
    },
    street: {
      label: 'Street',
      description: 'User Street Address line 1',
      type: 'string',
      required: false
    }
  },
  default: {
    city: { '@path': '$.traits.address.city' },
    country: { '@path': '$.traits.address.country' },
    postal_code: { '@path': '$.traits.address.postal_code' },
    state: { '@path': '$.traits.address.state' },
    street: { '@path': '$.traits.address.street' }
  }
}
```

If we were referencing data from a track() call we would do the following:

```typescript
export const address_identify: InputField = {
  label: 'User Address',
  description: "The user's address",
  type: 'object',
  required: false,
  additionalProperties: false,
  properties: {
    city: {
      label: 'City',
      description: 'User city',
      type: 'string'
      required: false
    },
    country: {
      label: 'Country',
      description: 'User country',
      type: 'string',
      required: false
    },
    postal_code: {
      label: 'Postal Code',
      description: 'User Postal Code',
      type: 'string',
      required: false
    },
    state: {
      label: 'State',
      description: 'User State',
      type: 'string',
      required: false
    },
    street: {
      label: 'Street',
      description: 'User Street Address line 1',
      type: 'string',
      required: false
    }
  },
  default: {
    city: {
      '@if': {
        exists: { '@path': '$.context.traits.address.city' },
        then: { '@path': '$.context.traits.address.city' },
        else: { '@path': '$.properties.address.city' }
      }
    },
    country: {
      '@if': {
        exists: { '@path': '$.context.traits.address.country' },
        then: { '@path': '$.context.traits.address.country' },
        else: { '@path': '$.properties.address.country' }
      }
    },
    postal_code: {
      '@if': {
        exists: { '@path': '$.context.traits.address.postal_code' },
        then: { '@path': '$.context.traits.address.postal_code' },
        else: { '@path': '$.properties.address.postal_code' }
      }
    },
    state: {
      '@if': {
        exists: { '@path': '$.context.traits.address.state' },
        then: { '@path': '$.context.traits.address.state' },
        else: { '@path': '$.properties.address.state' }
      }
    },
    street: {
      '@if': {
        exists: { '@path': '$.context.traits.address.street' },
        then: { '@path': '$.context.traits.address.street' },
        else: { '@path': '$.properties.address.street' }
      }
    }
  }
}
```

## Example 6 - an object field which allows additional properties / sub fields

In this example the `JSON Request Interface` contains an attribute of type `[k: string]: string | number | boolean`. This indicates that the object field can accept additional sub fields, as well as the predefined fields.
When converting this to a Field Definition we add the `additionalProperties: true` attribute to the object definition.

```typescript
interface DestinationJSON {
  /**
   * The user's address
   */
  userAddress?: {
    city?: string
    country?: string
    postal_code?: string
    state?: string
    street?: string
    [k: string]: string | number | boolean
  }
}
```

The Field Definitions would be identical to those in example 5, but with the addtion of `additionalProperties: true`.
Note that in this example it's not possible to specify the types for the additional fields in the Field Definition; we'll have to do validation in the perform() or performBatch() function.

```typescript
export const address_identify: InputField = {
  label: 'User Address',
  description: "The user's address",
  type: 'object',
  required: false,
  additionalProperties: true,
  properties: {
   ...
  },
  default: {
  ...
  }
}
```

## Example 7 - an object field without any predefined sub fields

It's common to specify object fields which don't have any predefined sub fields.
These fields are useful when the Destination API allows any type of JSON object to be passed for a specific attribute in the payload, of when the Destinations' API doesn't specify any specific sub fields.
In the example below, we have a object field called props which can accept any type of JSON.

```typescript
interface DestinationJSON {
  /**
   * Additional event properties
   */
  props?: {
    [k: string]: unknown
  }
}
```

Here is how this field could be defined.
Note that we've made a decision to set the detault mapping to `$.properties`, as we're assuming that we're handling a track() event:

```typescript
export const props: InputField = {
  label: 'Additional event properties',
  description: 'Additional event properties to add to the event',
  type: 'object',
  required: false,
  default: { '@path': '$.properties' }
}
```

## Example 9 - array fields for simple types

We can convert any simple type (`string`, `number`, `integer`, `boolean`) in a `JSON Request Interface` into an array Field Definition by adding the `multiple: true` attribute.

Take this typescript type as an example:

```typescript
interface DestinationJSON {
  /**
   * Labels
   */
  productLabels?: string[]
  /**
   * The age for each child
   */
  chileAges?: number[]
}
```

For brevity let's assume we're handling only identify() calls, but these fields could of course behave default mappings for track() calls.

```typescript
export const labels: InputField = {
  label: 'Product Labels',
  description: 'List of Product Labels',
  type: 'string',
  multiple: true,
  required: false,
  default: { '@path': '$.traits.product_labels' }
}

export const chileAges: InputField = {
  label: 'Child Ages',
  description: 'List of Child Ages',
  type: 'integer',
  multiple: true,
  required: false,
  default: { '@path': '$.traits.child_ages' }
}
```

## Example 10 - array fields for object types

We can also convert any Field definitions of type `object` into an array Field Definition by adding the `multiple: true` attribute.
This approach is commonly used for handling arrays of product objects. For example

```typescript
interface DestinationJSON {
  /**
   * Labels
   */
  products?: {
    /**
     * Product ID
     */
    id: string
    /**
     * Product Price
     */
    price: number
    /**
     * Product Name
     */
    name: string
    /**
     * Product Price
     */
    quantity: number
  }[]
}
```

For this example let's assume we'd collecting data from a track() event. This type of data would not be present in an identify() call.
Note that a product array is a predefined field in the Segment Ecommerce Spec.
Note that the default mapping uses `@arrayPath` to map to the array, and then has separate mapping for each sub field in the array.
In this example we're mapping to an array named `products`. And then each product item should have an `id`, `price`, `name`, `quantity`.

It's important to never have sub fields of type `object`. They should only be simple types such as `string`, `number`, `integer`, `boolean`.
Sub fields can be arrays of simple types though, so adding the `multiple: true` is permissable.

```typescript
export const products: InputField = {
  label: 'Products',
  description: "A List of product items",
  type: 'object',
  required: false,
  additionalProperties: false,
  properties: {
    id: {
      label: 'ID',
      description: 'Product ID',
      type: 'string'
      required: true
    },
    price: {
      label: 'Price',
      description: 'Product Price',
      type: 'number'
      required: true
    },
    name: {
      label: 'Name',
      description: 'Product Name',
      type: 'string'
      required: true
    },
    quantity: {
      label: 'Quantity',
      description: 'Product Quantity',
      type: 'integer'
      required: true
    }
  },
  default: {
    '@arrayPath': [
      '$.products',
      {
        id: { '@path': '$.id' },
        price: { '@path': '$.price' },
        name: { '@path': '$.name' },
        quantity: { '@path': '$.quantity' }
      }
    ]
  }
}
```

```

```
