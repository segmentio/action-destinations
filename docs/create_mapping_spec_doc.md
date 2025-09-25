# Steps to create a new cloud mode destination mapping spec

- Understand what a cloud mode Action Destination is.

  - Read:
    - https://segment.com/docs/connections/destinations/
    - https://segment.com/docs/connections/destinations/actions/
    - [./create.md](./create.md)
    - [Action Destination](.../README.md#action-destinations)

- Read through API documentation of the partner destination
  - Also read about that partner api from:
    - https://hightouch.com/docs/destinations
    - https://www.rudderstack.com/docs/destinations/overview/
- Decide what actions we want to build based on destination type: ([refer](./destination-types.md))
  - conversions
  - audience destinations
  - analytics destination
  - crm destinations
- Decide approptiate Authentication Strategy ([refer](./authentication.md))
  - oauth
  - api key
  - basic auth
- Do we need to support batching? If so, what's the batch size and batch byte? ([refer](../README.md#batching-requests))
- For each action, define mappings with default values and required fields (refer to [input fields](../README.md#input-fields), [default value](../README.md#default-values), [dynamic fields](../README.md#dynamic-fields))
- Use conditional validations wherever possible ([refer](../README.md#conditional-fields))
- Decide if we need to use hooks ([refer](../README.md#action-hooks))
- does batch API support multistatus or not? ([refer](./multistatus.md))
- Errors exposed by destination API and how they map with Segment Error types ([refer](./error-handling.md))
- Create Mapping Spec Doc <md document> (refer [a sample spec doc](./sample-mapping-spec-doc.md))
