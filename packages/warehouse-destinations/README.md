# `warehouse-destinations`

**For Segment Use Only**

Used to define warehouse destinations and their associated actions.

The perform block will never be called in these actions, they are only used to create definitions.

We do not need to register warehouse desitnations and return a manifest because the warehouse destination package is exclusively used by the CLI to push warehouse destination definitions to the Segment platform.

## Usage

```
const warehouseDestinations = require('warehouse-destinations');

const warehouseDefinitions = await warehouse.getDefinitions(actionsPath)
// returns a list of warehouse definitions that can be registered on the Segment platform.
```
