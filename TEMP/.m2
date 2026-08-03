{
  "actions": {
    "data": {
      "actions": [
        {
          "createdAt": "2025-06-20T21:49:31.000Z",
          "defaultTrigger": null,
          "description": "Send messages with Twilio's REST API.",
          "fields": [
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": null,
              "description": "The channel to send the message on.",
              "displayMetadata": null,
              "dynamic": true,
              "fieldKey": "channel",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "channel": {
                    "description": "The channel to send the message on.",
                    "format": null,
                    "title": "Channel",
                    "type": "string"
                  }
                },
                "required": [
                  "channel"
                ],
                "type": "object"
              },
              "id": "297EGD79qGh6sfLVCeC6ST",
              "label": "Channel",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": true,
              "sortOrder": 0,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": null,
              "description": "The Sender type to use for the message. Depending on the selected 'Channel' this can be a phone number, messaging service, or Messenger sender ID.",
              "displayMetadata": null,
              "dynamic": true,
              "fieldKey": "senderType",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "senderType": {
                    "description": "The Sender type to use for the message. Depending on the selected 'Channel' this can be a phone number, messaging service, or Messenger sender ID.",
                    "format": null,
                    "title": "Sender Type",
                    "type": "string"
                  }
                },
                "required": [
                  "senderType"
                ],
                "type": "object"
              },
              "id": "aoN6qxxzNS37SrU9A8JkPF",
              "label": "Sender Type",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": true,
              "sortOrder": 1,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": null,
              "description": "The Content Template type to use for the message. Selecting \"Inline\" will allow you to define the message body directly. For all other options a Content Template must be pre-defined in Twilio.",
              "displayMetadata": null,
              "dynamic": true,
              "fieldKey": "contentTemplateType",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "contentTemplateType": {
                    "description": "The Content Template type to use for the message. Selecting \"Inline\" will allow you to define the message body directly. For all other options a Content Template must be pre-defined in Twilio.",
                    "format": null,
                    "title": "Content Template Type",
                    "type": "string"
                  }
                },
                "required": [
                  "contentTemplateType"
                ],
                "type": "object"
              },
              "id": "bM5Dm7CACrfefKockBQFa",
              "label": "Content Template Type",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": true,
              "sortOrder": 2,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "channel",
                    "operator": "is_not",
                    "value": "Messenger"
                  }
                ],
                "match": "all"
              },
              "description": "The number to send the message to (E.164 format).",
              "displayMetadata": null,
              "dynamic": false,
              "fieldKey": "toPhoneNumber",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "toPhoneNumber": {
                    "description": "The number to send the message to (E.164 format).",
                    "format": null,
                    "title": "To Phone Number",
                    "type": "string"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "hKYUFMqPUng9Uj8rjssXDE",
              "label": "To Phone Number",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 3,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "channel",
                    "operator": "is",
                    "value": "Messenger"
                  }
                ],
                "match": "all"
              },
              "description": "A valid Facebook Messenger User Id to send the message to.",
              "displayMetadata": {
                "conditionallyRequired": {
                  "conditions": [
                    {
                      "fieldKey": "channel",
                      "operator": "is",
                      "value": "Messenger"
                    }
                  ],
                  "match": "all"
                }
              },
              "dynamic": false,
              "fieldKey": "toMessengerUserId",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "allOf": [
                  {
                    "if": {
                      "properties": {
                        "channel": {
                          "const": "Messenger"
                        }
                      },
                      "required": [
                        "channel"
                      ]
                    },
                    "then": {
                      "required": [
                        "toMessengerUserId"
                      ]
                    }
                  }
                ],
                "properties": {
                  "toMessengerUserId": {
                    "description": "A valid Facebook Messenger User Id to send the message to.",
                    "format": null,
                    "title": "To Messenger User ID",
                    "type": "string"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "j3d2FTNTtPJZS3uB1merG9",
              "label": "To Messenger User ID",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 4,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "senderType",
                    "operator": "is",
                    "value": "Phone number"
                  },
                  {
                    "fieldKey": "channels",
                    "operator": "is_not",
                    "value": "Messenger"
                  }
                ],
                "match": "all"
              },
              "description": "The Twilio phone number (E.164 format) or Short Code. If not in the dropdown, enter it directly. Please ensure the number supports the selected 'Channel' type.",
              "displayMetadata": null,
              "dynamic": true,
              "fieldKey": "fromPhoneNumber",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "fromPhoneNumber": {
                    "description": "The Twilio phone number (E.164 format) or Short Code. If not in the dropdown, enter it directly. Please ensure the number supports the selected 'Channel' type.",
                    "format": null,
                    "title": "From Phone Number",
                    "type": "string"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "vWKR8EwvYrZJ7TLNW2xAKD",
              "label": "From Phone Number",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 5,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "channel",
                    "operator": "is",
                    "value": "Messenger"
                  }
                ],
                "match": "all"
              },
              "description": "The unique identifier for your Facebook Page, used to send messages via Messenger. You can find this in your Facebook Page settings.",
              "displayMetadata": {
                "conditionallyRequired": {
                  "conditions": [
                    {
                      "fieldKey": "channel",
                      "operator": "is",
                      "value": "Messenger"
                    }
                  ],
                  "match": "all"
                }
              },
              "dynamic": false,
              "fieldKey": "fromFacebookPageId",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "allOf": [
                  {
                    "if": {
                      "properties": {
                        "channel": {
                          "const": "Messenger"
                        }
                      },
                      "required": [
                        "channel"
                      ]
                    },
                    "then": {
                      "required": [
                        "fromFacebookPageId"
                      ]
                    }
                  }
                ],
                "properties": {
                  "fromFacebookPageId": {
                    "description": "The unique identifier for your Facebook Page, used to send messages via Messenger. You can find this in your Facebook Page settings.",
                    "format": null,
                    "title": "From Facebook Page ID",
                    "type": "string"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "q9KYg1ywZZPEio4U3U3KtN",
              "label": "From Facebook Page ID",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 6,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "senderType",
                    "operator": "is",
                    "value": "Messaging Service"
                  },
                  {
                    "fieldKey": "channels",
                    "operator": "is_not",
                    "value": "Messenger"
                  }
                ],
                "match": "all"
              },
              "description": "The SID of the messaging service to use. If not in the dropdown, enter it directly.",
              "displayMetadata": {
                "conditionallyRequired": {
                  "conditions": [
                    {
                      "fieldKey": "channel",
                      "operator": "is",
                      "value": "RCS"
                    }
                  ]
                }
              },
              "dynamic": true,
              "fieldKey": "messagingServiceSid",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "allOf": [
                  {
                    "if": {
                      "properties": {
                        "channel": {
                          "const": "RCS"
                        }
                      },
                      "required": [
                        "channel"
                      ]
                    },
                    "then": {
                      "required": [
                        "messagingServiceSid"
                      ]
                    }
                  }
                ],
                "properties": {
                  "messagingServiceSid": {
                    "description": "The SID of the messaging service to use. If not in the dropdown, enter it directly.",
                    "format": null,
                    "title": "Messaging Service SID",
                    "type": "string"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "a3rtadQi4YoqogNcSW7G4G",
              "label": "Messaging Service SID",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 7,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "contentTemplateType",
                    "operator": "is_not",
                    "value": "Inline"
                  }
                ],
                "match": "all"
              },
              "description": "The SID of the Content Template to use.",
              "displayMetadata": null,
              "dynamic": true,
              "fieldKey": "contentSid",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "contentSid": {
                    "description": "The SID of the Content Template to use.",
                    "format": null,
                    "title": "Content Template SID",
                    "type": "string"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "4R2LVu9FJkxY2HxVQNKhDA",
              "label": "Content Template SID",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 8,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "defaultObjectUI": "keyvalue",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "contentTemplateType",
                    "operator": "is_not",
                    "value": "Inline"
                  }
                ],
                "match": "all"
              },
              "description": "Variables to be used in the Content Template. The Variables must be defined in the Content Template in Twilio.",
              "displayMetadata": {
                "dynamicProperties": [
                  "__keys__"
                ]
              },
              "dynamic": true,
              "fieldKey": "contentVariables",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": true,
                "properties": {
                  "contentVariables": {
                    "description": "Variables to be used in the Content Template. The Variables must be defined in the Content Template in Twilio.",
                    "format": null,
                    "title": "Content Variables",
                    "type": "object"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "5YVqESJEe2JmkYPEKoNgYM",
              "label": "Content Variables",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 9,
              "type": "object",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "contentTemplateType",
                    "operator": "is",
                    "value": "Inline"
                  }
                ],
                "match": "all"
              },
              "description": "Define an inline message body to be sent. Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.",
              "displayMetadata": null,
              "dynamic": false,
              "fieldKey": "inlineBody",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "inlineBody": {
                    "description": "Define an inline message body to be sent. Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.",
                    "format": "text",
                    "title": "Inline Template",
                    "type": "string"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "9irdSgDvqE1NfR3HMRLeg8",
              "label": "Inline Template",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 10,
              "type": "text",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "contentTemplateType",
                    "operator": "is",
                    "value": "Inline"
                  }
                ],
                "match": "all"
              },
              "description": "The URLs of the media to sent with the inline message. The URLs must be publicaly accessible.",
              "displayMetadata": null,
              "dynamic": false,
              "fieldKey": "inlineMediaUrls",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "inlineMediaUrls": {
                    "description": "The URLs of the media to sent with the inline message. The URLs must be publicaly accessible.",
                    "format": null,
                    "items": {
                      "type": "string"
                    },
                    "title": "Inline Media URLs",
                    "type": "array"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "DvzuWyvrgQShzDSeYb838",
              "label": "Inline Media URLs",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": true,
              "placeholder": "",
              "required": false,
              "sortOrder": 11,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": null,
              "description": "The number of seconds between 1-14400 that the message is valid for. Default is 14400. If the message is not delivered within this time, it will not be delivered.",
              "displayMetadata": null,
              "dynamic": false,
              "fieldKey": "validityPeriod",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "validityPeriod": {
                    "description": "The number of seconds between 1-14400 that the message is valid for. Default is 14400. If the message is not delivered within this time, it will not be delivered.",
                    "format": null,
                    "maximum": 14400,
                    "minimum": 1,
                    "title": "Validity Period",
                    "type": "number"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "jqKmyC2rWBx6v4PXZWFHCi",
              "label": "Validity Period",
              "maximum": 14400,
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "minimum": 1,
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 12,
              "type": "number",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": {
                "conditions": [
                  {
                    "fieldKey": "senderType",
                    "operator": "is",
                    "value": "Messaging Service"
                  },
                  {
                    "fieldKey": "messagingServiceSid",
                    "operator": "is_not",
                    "value": ""
                  }
                ],
                "match": "all"
              },
              "description": "The time that Twilio will send the message. Must be in ISO 8601 format. Messages can be scheduled up to 35 days in advance, and at least 15 minutes in advance.",
              "displayMetadata": null,
              "dynamic": false,
              "fieldKey": "sendAt",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "sendAt": {
                    "description": "The time that Twilio will send the message. Must be in ISO 8601 format. Messages can be scheduled up to 35 days in advance, and at least 15 minutes in advance.",
                    "format": "date-time",
                    "title": "Send At",
                    "type": "string"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "rzkmBVvA8g1hNev5tHHZvK",
              "label": "Send At",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 13,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "defaultObjectUI": "keyvalue",
              "dependsOn": null,
              "description": "Custom tags to be included in the message. Key:value pairs of strings are allowed.",
              "displayMetadata": null,
              "dynamic": false,
              "fieldKey": "tags",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "properties": {
                  "tags": {
                    "description": "Custom tags to be included in the message. Key:value pairs of strings are allowed.",
                    "format": null,
                    "title": "Tags",
                    "type": "object"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "u4iSeFuaagpkUAqZgqggmJ",
              "label": "Tags",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 14,
              "type": "object",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            },
            {
              "allowNull": false,
              "choices": null,
              "createdAt": "2026-07-31T13:47:36.000Z",
              "dependsOn": null,
              "description": "TEMPORARY bug-bash field (TC33) \u2014 required only when channel is Messenger.",
              "displayMetadata": {
                "conditionallyRequired": {
                  "conditions": [
                    {
                      "fieldKey": "channel",
                      "operator": "is",
                      "value": "Messenger"
                    }
                  ],
                  "match": "all"
                }
              },
              "dynamic": false,
              "fieldKey": "testConditionalField",
              "fieldSchema": {
                "$schema": "http://json-schema.org/schema#",
                "additionalProperties": false,
                "allOf": [
                  {
                    "if": {
                      "properties": {
                        "channel": {
                          "const": "Messenger"
                        }
                      },
                      "required": [
                        "channel"
                      ]
                    },
                    "then": {
                      "required": [
                        "testConditionalField"
                      ]
                    }
                  }
                ],
                "properties": {
                  "testConditionalField": {
                    "description": "TEMPORARY bug-bash field (TC33) \u2014 required only when channel is Messenger.",
                    "format": null,
                    "title": "Test Conditional Field",
                    "type": "string"
                  }
                },
                "required": [],
                "type": "object"
              },
              "id": "dSKCNtdCALysXzcAAzrnpJ",
              "label": "Test Conditional Field",
              "metadataActionId": "h12tQnPfT8BEYcerDxYWJq",
              "multiple": false,
              "placeholder": "",
              "required": false,
              "sortOrder": 15,
              "type": "string",
              "updatedAt": "2026-07-31T13:47:36.000Z"
            }
          ],
          "hidden": false,
          "id": "h12tQnPfT8BEYcerDxYWJq",
          "metadataId": "674f23ece330374dc1ecc874",
          "name": "Send message",
          "platform": "cloud",
          "slug": "sendMessage",
          "updatedAt": "2025-06-20T21:49:31.000Z"
        }
      ]
    }
  },
  "advancedOptions": [],
  "authenticationScheme": "basic",
  "basicOptions": [
    "accountSID",
    "apiKeySID",
    "apiKeySecret"
  ],
  "browserUnbundlingChangelog": "",
  "browserUnbundlingPublic": false,
  "browserUnbundlingSupported": false,
  "categories": [],
  "components": [],
  "contacts": [],
  "content": {
    "beta": false,
    "categories": [
      {
        "id": "16UERaW9k2Zcv6TSyBO2Ry",
        "name": "SMS & Push Notifications",
        "slug": "sms-push-notifications"
      },
      {
        "id": "30YfZuJRWNAFfS086GCkIs",
        "name": "Email Marketing",
        "slug": "email-marketing"
      }
    ],
    "contentId": "kBgrjTiWE2IpKihyOyjQK",
    "docsUrl": "https://segment.com/docs/connections/destinations/catalog/actions-twilio-messaging/",
    "fastGrowingCompany": false,
    "features": "<ul><li><p>Enables businesses to send personalized SMS, MMS, RCS, WhatsApp, and Facebook Messenger messages directly through Twilio.</p></li><li><p>Helps improve customer engagement with real-time, multi-channel communication.</p></li><li><p>Common use cases include transactional alerts (order confirmations, delivery updates), marketing campaigns, customer support, personalized reminders.</p></li></ul><p></p>",
    "integrationType": "destination",
    "introduction": "Send SMS, MMS, RCS, Whatsapp and Facebook Messenger messages from Twilio",
    "logo": {
      "alt": "actions-twilio-messaging Asset from Developer Portal",
      "id": "4lGseAz9waN30xyOBP8U0R",
      "src": "//images.ctfassets.net/h6ufgtwb6nv1/4lGseAz9waN30xyOBP8U0R/23c34671d71c66ece4b4e3bdb6308b64/actions-twilio-messaging_Asset_from_Developer_Portal"
    },
    "mainCategory": "sms-push-notifications",
    "name": "Twilio Messaging",
    "privateBeta": false,
    "screenshots": [],
    "slug": "actions-twilio-messaging",
    "website": "http://www.segment.com",
    "withSegment": "<h2>Get more out of Twilio Messaging with Segment</h2><ul><li><p>Segment automatically routes your customer event data into Twilio without additional coding.</p></li><li><p>You can define triggers (e.g., \u201cOrder Placed\u201d or \u201cCart Abandoned\u201d) in Segment, and messages are sent through Twilio to the right channel.</p></li><li><p>Segment Engage customers can trigger messages as users enter or exist Audiences.</p></li></ul><p></p>",
    "withoutSegment": "<h2>How Twilio Messaging Works</h2><ul><li><p>You connect directly to Twilio\u2019s messaging APIs.</p></li><li><p>Developers must manually integrate and manage message formatting, routing, and delivery across channels.</p></li><li><p>Requires custom code to trigger messages and handle customer data.</p></li></ul><p></p>"
  },
  "contentId": "actions-twilio-messaging",
  "createdAt": "2024-12-03T15:29:48.034Z",
  "creationName": "Twilio Messaging",
  "description": "Send SMS, MMS, Whatsapp and Messenger messages with Twilio",
  "developerCenterMetadata": {},
  "direct": false,
  "endpoint": "",
  "features": {
    "audiencesPolicy": {
      "frequencyLimitSeconds": null,
      "sendIdentify": true,
      "sendTrack": false
    },
    "replayPolicy": {
      "acceptsTimestamps": false,
      "aliasAcceptsTimestamps": false,
      "aliasHasDedupeLogic": false,
      "groupAcceptsTimestamps": false,
      "groupHasDedupeLogic": false,
      "hasDedupeLogic": false,
      "identifyAcceptsTimestamps": false,
      "identifyHasDedupeLogic": false,
      "note": "",
      "pageviewAcceptsTimestamps": false,
      "pageviewHasDedupeLogic": false,
      "trackAcceptsTimestamps": false,
      "trackHasDedupeLogic": false
    }
  },
  "id": "674f23ece330374dc1ecc874",
  "installCount": 5,
  "isFeatured": false,
  "level": 1,
  "logos": {
    "default": "https://cdn-devcenter.segment.build/24fd97f0-77e0-4db0-b75d-ab7a39ec9873.svg",
    "mark": "https://cdn-devcenter.segment.build/e01b9310-2544-4734-bea5-a70790784782.svg"
  },
  "methods": {
    "alias": true,
    "group": true,
    "identify": true,
    "pageview": true,
    "track": true
  },
  "multiInstanceSupportedVersion": "CLOUD_ONLY",
  "name": "Twilio Messaging",
  "note": "",
  "options": {
    "accountSID": {
      "default": "",
      "dependsOn": null,
      "description": "Twilio Account SID",
      "dynamic": false,
      "encrypt": false,
      "hidden": false,
      "label": "Twilio Account SID",
      "private": true,
      "readOnly": false,
      "required": true,
      "scope": "event_destination",
      "tags": [
        "authentication:test"
      ],
      "type": "string",
      "validators": [
        [
          "required",
          "The accountSID property is required."
        ]
      ]
    },
    "apiKeySID": {
      "default": "",
      "dependsOn": null,
      "description": "Twilio API Key SID",
      "dynamic": false,
      "encrypt": false,
      "hidden": false,
      "label": "Twilio API Key SID",
      "private": true,
      "readOnly": false,
      "required": true,
      "scope": "event_destination",
      "tags": [
        "authentication:test"
      ],
      "type": "string",
      "validators": [
        [
          "required",
          "The apiKeySID property is required."
        ]
      ]
    },
    "apiKeySecret": {
      "default": "",
      "dependsOn": null,
      "description": "Twilio API Key Secret",
      "dynamic": false,
      "encrypt": true,
      "hidden": false,
      "label": "Twilio API Key Secret",
      "private": true,
      "readOnly": false,
      "required": true,
      "scope": "event_destination",
      "tags": [
        "authentication:test"
      ],
      "type": "password",
      "validators": [
        [
          "required",
          "The apiKeySecret property is required."
        ]
      ]
    }
  },
  "owners": [],
  "partnerOwned": false,
  "partnerSettings": {},
  "personasMaxRequestsPerSecond": null,
  "platforms": {
    "browser": true,
    "cloudAppObject": false,
    "linkedAudiences": true,
    "mobile": false,
    "server": true,
    "warehouse": false
  },
  "presets": {
    "data": {
      "presets": []
    }
  },
  "previousNames": [
    "Twilio Messaging"
  ],
  "public": false,
  "regionEndpoints": null,
  "replaySupported": false,
  "slug": "actions-twilio-messaging",
  "status": "PUBLIC",
  "support": {},
  "supportedRegions": [
    "us-west-2",
    "eu-west-1"
  ],
  "supportsAudiences": false,
  "type": "action_destination",
  "unbundleByDefault": false,
  "updatedAt": "2026-07-31T13:47:36.424Z",
  "website": "http://www.segment.com"
}