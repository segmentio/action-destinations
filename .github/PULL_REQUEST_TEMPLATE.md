<!-- Hello and thank you for contributing to Segment action-destinations! -->

<!-- Before opening your pull request, make sure you have added and ran unit
     tests and tested your change locally. Refer to our testing
     documentation for more information: https://github.com/segmentio/action-destinations/blob/main/docs/testing.md -->

<!-- If you have questions or issues please open a new issue or create a new discussion
     post in Github. -->

_A summary of your pull request, including the what change you're making and why._

## Testing

_Include any additional information about the testing you have completed to
ensure your changes behave as expected. For a speedy review, please check
any of the tasks you completed below during your testing._

- [ ] Added [unit tests](https://github.com/segmentio/action-destinations/blob/main/docs/testing.md#local-end-to-end-testing) for new functionality
- [ ] Tested end-to-end using the [local server](https://github.com/segmentio/action-destinations/blob/main/docs/testing.md#local-end-to-end-testing)
- [ ] [Segmenters] Tested in the staging environment
- [ ] Confirmed via tests that this change doesn't break existing destination configuration in production, including the following:
  - No new mapping/settings were added as required fields to an action/destination that is already live in production with traffic. All new fields must be optional.
  - No existing mapping/settings were removed or changed in a way that would break existing destination configurations.
