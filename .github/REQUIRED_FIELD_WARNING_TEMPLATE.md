<!--REQUIRED_FIELD_DIFF-->

# New required fields detected

> [!WARNING]
> Your PR adds new required fields to an existing destination. Adding new required settings/mappings for a destination already in production requires updating existing customer destination configuration. Ignore this warning if this PR is for a new destination with no active customers in production.

The following required fields were added in this PR:

{{FIELDS_ADDED}}

Add these new fields as optional instead and assume default values in `perform` or `performBatch` block.
