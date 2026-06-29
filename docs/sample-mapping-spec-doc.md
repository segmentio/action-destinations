# **Klaviyo (Actions) Destination Spec**

## **Segment Ecosystem Support**

| Supports Engage               | ✅(Add to list, Remove from list) |
| :---------------------------- | :-------------------------------- |
| **Supports RETL**             | **✅**                            |
| **Supports Trait Enrichment** | **❌**                            |

# **Open Questions**

1.  Should Order Completed be a preset config of Track Event or a separate action?

    1.  For Order Completed Event, the classic destination first needs to send an Order Competed event followed by Ordered Product Events for each product in the products array.

              *We are going to build Order Complete event as a separate action*

2.  We have Klaviyo Source in our Catalog, and it seems like we have special setting to prevent Klaviyo from sending events send via Klaviyo Destination. Refer Segment doc [here](https://segment.com/docs/connections/sources/catalog/cloud-apps/klaviyo/#preventing-duplication-in-segment). But a recent [question](https://twilio.slack.com/archives/CC97A542H/p1687446407560739) on \#question-destinations says that it is not possible to connect Klaviyo Source to Klaviyo Destination. Do we still need special fields to avoid MTU explosion?  
    _Yes_
3.  The classic destination supports adding users to [Lists](https://help.klaviyo.com/hc/en-us/articles/115005061447#section1) in Klaviyo.
    1. Should we create a separate audience destination for AddToList or Should we add it as an action?  
       _Adding as an action_
    2. Should we also support Remove From List/Unsubscribe From List?
       1. _Yes_
    3. What would be a better name if we are going to support add and remove?
4.  How do we support [this](https://segment.atlassian.net/browse/STRATCONN-2897) ask (Re-subscribing users via Segment\<\>Klaviyo)?  
    The V1 Add To List API we use doesn’t affect subscription status but using the new [Subscribe Profiles](https://developers.klaviyo.com/en/reference/subscribe_profiles) and implementing [Unsubscribe Profiles](https://developers.klaviyo.com/en/reference/unsubscribe_profiles) API should address the concerns of this ticket.  
    _~~We are not going to worry about this requirement for the time being~~_  
    [_Understanding active email profiles in Klaviyo_](https://help.klaviyo.com/hc/en-us/articles/115005246968#viewing-a-profile-s-consent-status2)  
    _Subscribing a Profile: A subscribed profile is one that has given explicit permission to receive marketing emails. This could be through filling out a signup form or directly providing their email address to you. When a profile is subscribed, they are not just added to a list but also marked as 'Active', which means they can receive emails from you. In essence, subscribing indicates a higher level of engagement and consent from the contact._

    _Add to a list: Adding a profile to a list doesn't necessarily equate to subscription. It's possible for us to have profiles that haven't explicitly subscribed, but whose email addresses we've obtained through general engagement and we add that email to a list._

5.  Are there any other feedback in Salesforce for Klaviyo which we should consider for the rebuild?

    1. Upgrade to Klaviyo v2 \-

       1. [https://segment.lightning.force.com/lightning/r/Product_Gap\_\_c/a3s3q0000001N4KAAU/view](https://segment.lightning.force.com/lightning/r/Product_Gap__c/a3s3q0000001N4KAAU/view)
       2. Glowforge is requesting a Klaviyo upgrade to List API V2 to help solve data flow issues

    2. Staples feedback
       1. Add custom order_id
       2. [https://segment.lightning.force.com/lightning/r/Product_Gap\_\_c/a3s3q000000AqpmAAC/view](https://segment.lightning.force.com/lightning/r/Product_Gap__c/a3s3q000000AqpmAAC/view)  
          This issue Staples is having is that they allow for multiple refunds per order. Klaviyo heard that request and made a change that would allow for Segment to facilitate sending multiple refunds per order. Here are the changes they would ask the Segment make:  
          Create a setting that would enable this feature for Staples and for other customers who might need it.  
          Only for these events (Order Completed, Order Refunded, and Order Cancelled) supply a completely unique $event_id (I wonder if this could just be messageId).  
          Add a property on these events called $original_order_identifier. This field should be mapped from order_id.

# **Global Settings**

## **Authentication**

- Custom Authentication: All Klaviyo APIs are now authenticated and authorized via [Private API Keys](https://help.klaviyo.com/hc/en-us/articles/7423954176283). Private API Key should be provided in the following header format for all API calls.

```
Authorization: Klaviyo-API-Key {your-private-api-key}
```

| Setting         | Description                                                                                               | Type                     | Example |
| :-------------- | :-------------------------------------------------------------------------------------------------------- | :----------------------- | :------ |
| Private API Key | You can find this by going to Klaviyo’s UI and clicking Account \> Settings \> API Keys \> Create API Key | String; Format: password |         |

#

## **Other Settings**

| Setting | Description | Type | Example |
| :------ | :---------- | :--- | :------ |
|         |             |      |         |

## **On Delete**

Endpoint \-\> [https://a.klaviyo.com/api/data-privacy-deletion-jobs/](https://a.klaviyo.com/api/data-privacy-deletion-jobs/)  
Klaviyo Docs \-\> https://developers.klaviyo.com/en/reference/request\_profile\_deletion

# **Why are we building this?**

We aim to rebuild our [cloud-mode Klaviyo destination](https://segment.com/docs/connections/destinations/catalog/klaviyo/) on the Action Destination Framework. Klaviyo is a marketing automation platform that automates eCommerce SMS and email marketing to help businesses acquire, retain and grow their customers by sending marketing emails.

Why are we rebuilding in actions?

- v1/v2 Deprecation – Leverage and shift customers to Actions.
- RETL Support \- RETL only supports action destinations
- Tier 1 Destination – ARR: 19M, Paying Customers: 272

# **Endpoints**

- [Create Event](https://developers.klaviyo.com/en/reference/create_event): Burst: 350/s; Steady: 3500/m
- [Create Profile](https://developers.klaviyo.com/en/reference/create_profile): Burst 75/s; Steady: 700/m
- [Update Profile](https://developers.klaviyo.com/en/reference/update_profile): Burst 75/s; Steady: 700/m
- [Subscribe Profiles](https://developers.klaviyo.com/en/reference/subscribe_profiles): Burst 75/s; Steady: 700/m
- [Add Profile to List](https://developers.klaviyo.com/en/reference/create_list_relationships): Burst: 10/s; Steady: 150/m
- [Remove Profile From List](https://developers.klaviyo.com/en/reference/delete_list_relationships): Burst: 10/s; Steady: 150/m

# **API Responses**

### [**Create Event**](https://developers.klaviyo.com/en/reference/create_event)

## 202

### [**Create Profile**](https://developers.klaviyo.com/en/reference/create_profile)

##### 201

```
{
  "data": {
    "type": "profile",
    "id": "01GDDKASAP8TKDDA2GRZDSVP4H",
    "attributes": {
      "email": "sarah.mason@klaviyo-demo.com",
      "phone_number": "+15005550006",
      "external_id": "63f64a2b-c6bf-40c7-b81f-bed08162edbe",
      "first_name": "Sarah",
      "last_name": "Mason",
      "organization": "Klaviyo",
      "title": "Engineer",
      "image": "https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg",
      "created": "2022-11-08T00:00:00",
      "updated": "2022-11-08T00:00:00",
      "last_event_date": "2022-11-08T00:00:00",
      "location": {
        "address1": "89 E 42nd St",
        "address2": "1st floor",
        "city": "New York",
        "country": "United States",
        "latitude": "string",
        "longitude": "string",
        "region": "NY",
        "zip": "10017",
        "timezone": "America/New_York"
      },
      "properties": {
        "pseudonym": "Dr. Octopus"
      },
      "subscriptions": {
        "email": {
          "marketing": {
            "consent": "SUBSCRIBED",
            "timestamp": "2023-02-21T20:07:38+00:00",
            "method": "PREFERENCE_PAGE",
            "method_detail": "mydomain.com/signup",
            "custom_method_detail": "marketing drive",
            "double_optin": "True",
            "suppressions": [
              {
                "reason": "HARD_BOUNCE",
                "timestamp": "2023-02-21T20:07:38+00:00"
              }
            ],
            "list_suppressions": [
              {
                "list_id": "Y6nRLr",
                "reason": "USER_SUPPRESSED",
                "timestamp": "2023-02-21T20:07:38+00:00"
              }
            ]
          }
        },
        "sms": {
          "marketing": {
            "consent": "SUBSCRIBED",
            "timestamp": "2023-02-21T20:07:38+00:00",
            "method": "TEXT",
            "method_detail": "JOIN"
          }
        }
      },
      "predictive_analytics": {
        "historic_clv": 93.87,
        "predicted_clv": 27.24,
        "total_clv": 121.11,
        "historic_number_of_orders": 2,
        "predicted_number_of_orders": 0.54,
        "average_days_between_orders": 189,
        "average_order_value": 46.94,
        "churn_probability": 0.89,
        "expected_date_of_next_order": "2022-11-08T00:00:00"
      }
    },
    "relationships": {
      "lists": {
        "data": [
          {
            "type": "list",
            "id": "string"
          }
        ],
        "links": {
          "self": "string",
          "related": "string"
        }
      },
      "segments": {
        "data": [
          {
            "type": "segment",
            "id": "string"
          }
        ],
        "links": {
          "self": "string",
          "related": "string"
        }
      }
    },
    "links": {
      "self": "string"
    }
  }
}
```

###

###

###

### [**Update Profile**](https://developers.klaviyo.com/en/reference/update_profile)

##### 200

```
{
  "data": {
    "type": "profile",
    "id": "01GDDKASAP8TKDDA2GRZDSVP4H",
    "attributes": {
      "email": "sarah.mason@klaviyo-demo.com",
      "phone_number": "+15005550006",
      "external_id": "63f64a2b-c6bf-40c7-b81f-bed08162edbe",
      "first_name": "Sarah",
      "last_name": "Mason",
      "organization": "Klaviyo",
      "title": "Engineer",
      "image": "https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg",
      "created": "2022-11-08T00:00:00",
      "updated": "2022-11-08T00:00:00",
      "last_event_date": "2022-11-08T00:00:00",
      "location": {
        "address1": "89 E 42nd St",
        "address2": "1st floor",
        "city": "New York",
        "country": "United States",
        "latitude": "string",
        "longitude": "string",
        "region": "NY",
        "zip": "10017",
        "timezone": "America/New_York"
      },
      "properties": {
        "pseudonym": "Dr. Octopus"
      },
      "subscriptions": {
        "email": {
          "marketing": {
            "consent": "SUBSCRIBED",
            "timestamp": "2023-02-21T20:07:38+00:00",
            "method": "PREFERENCE_PAGE",
            "method_detail": "mydomain.com/signup",
            "custom_method_detail": "marketing drive",
            "double_optin": "True",
            "suppressions": [
              {
                "reason": "HARD_BOUNCE",
                "timestamp": "2023-02-21T20:07:38+00:00"
              }
            ],
            "list_suppressions": [
              {
                "list_id": "Y6nRLr",
                "reason": "USER_SUPPRESSED",
                "timestamp": "2023-02-21T20:07:38+00:00"
              }
            ]
          }
        },
        "sms": {
          "marketing": {
            "consent": "SUBSCRIBED",
            "timestamp": "2023-02-21T20:07:38+00:00",
            "method": "TEXT",
            "method_detail": "JOIN"
          }
        }
      },
      "predictive_analytics": {
        "historic_clv": 93.87,
        "predicted_clv": 27.24,
        "total_clv": 121.11,
        "historic_number_of_orders": 2,
        "predicted_number_of_orders": 0.54,
        "average_days_between_orders": 189,
        "average_order_value": 46.94,
        "churn_probability": 0.89,
        "expected_date_of_next_order": "2022-11-08T00:00:00"
      }
    },
    "relationships": {
      "lists": {
        "data": [
          {
            "type": "list",
            "id": "string"
          }
        ],
        "links": {
          "self": "string",
          "related": "string"
        }
      },
      "segments": {
        "data": [
          {
            "type": "segment",
            "id": "string"
          }
        ],
        "links": {
          "self": "string",
          "related": "string"
        }
      }
    },
    "links": {
      "self": "string"
    }
  }
}
```

### [**Subscribe Profiles**](https://developers.klaviyo.com/en/reference/subscribe_profiles)

## 202

### [**Add profile to list**](https://developers.klaviyo.com/en/reference/create_list_relationships)

##### 204

##### List Id not found:

```javascript
{
"errors": [
{
"id": "d5c8fb94-aaee-4cec-96c6-6285000b966f",
"status": 404,
"code": "not_found",
"title": "Not found.",
"detail": "List UHbQG does not exist.",
"source": {
"pointer": "/data/"
}
}
]
}

```

##### Profile Id not found:

```
{
"errors": [
{
"id": "6307d031-4792-4552-8683-b762e16bb741",
"status": 400,
"code": "invalid",
"title": "Invalid input.",
"detail": "Invalid profile IDs: {'swdwdwdw'}",
"source": {
"pointer": "/data/"
}
}
]
}

```

### **Error Responses**

##### 4xx

```
{
  "errors": [
    {
      "id": "string",
      "code": "string",
      "title": "string",
      "detail": "string",
      "source": {
        "pointer": "string",
        "parameter": "string"
      }
    }
  ]
}
```

##### 5xx

```
{
  "errors": [
    {
      "id": "string",
      "code": "string",
      "title": "string",
      "detail": "string",
      "source": {
        "pointer": "string",
        "parameter": "string"
      }
    }
  ]
}

```

# **Supported Actions**

| Action           | Description                                                                                                                                                        | Default Segment Event | \[Destination Name\] Event | Considerations                                                                       |
| :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- | :------------------------- | :----------------------------------------------------------------------------------- |
| Upsert Profile   | Create or Update a Profile                                                                                                                                         | identify              |                            | Returns 409 if profile already exists. Profile id is returned in the error response. |
| Track Event      | Track Event action should track user events and associate it with their profile.                                                                                   | track                 |                            |                                                                                      |
| Order Completed  | For an Order Completed Event, the action should first send an Order Completed event and then for each product in the event, send a separate Ordered Product Event. | track                 |                            |                                                                                      |
| Add to List      | Add a profile to an audience list                                                                                                                                  | identify              |                            | This endpoint accepts a maximum of 1000 profiles per call.                           |
| Remove from List | Remove a profile from a list                                                                                                                                       | identify              |                            |                                                                                      |
| Remove Profile   | Remove a profile from a list (supports rETL)                                                                                                                       | identify              |                            |                                                                                      |

# **Field Mappings**

## **Upsert Profile**

| Requiredness | \[Destination Name\] Field (display name) | Segment Default (if any) | Type                  | Description                                                                                                                                                       | Notes                                                                                                                                                                               |
| :----------- | :---------------------------------------- | :----------------------- | :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N            | email                                     | $.traits.email           | String; Format: Email | Individual's email address. One of External ID, Phone Number and Email required.                                                                                  |                                                                                                                                                                                     |
| N            | phone_number                              | $.context.traits.phone   | String;               | Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID. |                                                                                                                                                                                     |
| N            | external_id                               |                          | String                | A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system                                                           | No default Mapping set because in classic destination we enforce email as the profile identifier. Refer [here](https://segment.com/docs/connections/destinations/catalog/klaviyo/). |
| N            | first_name                                | $.traits.firstName       | String                | Individual's first name                                                                                                                                           |                                                                                                                                                                                     |
| N            | last_name                                 | $.traits.lastName        | String                | Individual's last name                                                                                                                                            |                                                                                                                                                                                     |
| N            | organization                              | $.traits.company.name    | String                | Name of the company or organization within the company for whom the individual works                                                                              |                                                                                                                                                                                     |
| N            | title                                     | $.traits.title           | String                | Individual's job title                                                                                                                                            |                                                                                                                                                                                     |
| N            | image                                     | $.traits.avatar          | String                | URL pointing to the location of a profile image                                                                                                                   |                                                                                                                                                                                     |
| N            | location                                  |                          | Object                |                                                                                                                                                                   |                                                                                                                                                                                     |
|              | location.address1                         |                          | String                |                                                                                                                                                                   |                                                                                                                                                                                     |
|              | location.address2                         |                          |                       |                                                                                                                                                                   |                                                                                                                                                                                     |
|              | location.city                             |                          |                       |                                                                                                                                                                   |                                                                                                                                                                                     |
|              | location.country                          |                          |                       |                                                                                                                                                                   |                                                                                                                                                                                     |
|              | location.latitude                         |                          | String                |                                                                                                                                                                   |                                                                                                                                                                                     |
|              | location.longitude                        |                          | String                |                                                                                                                                                                   |                                                                                                                                                                                     |
|              | location.region                           |                          | String                |                                                                                                                                                                   |                                                                                                                                                                                     |
|              | location.zip                              |                          | String                |                                                                                                                                                                   |                                                                                                                                                                                     |
|              | location.region                           |                          | String                |                                                                                                                                                                   |                                                                                                                                                                                     |
| N            | properties                                |                          | object                | An object containing key/value pairs for any custom properties assigned to this profile                                                                           |                                                                                                                                                                                     |
| N            | list_id                                   |                          | string                | The ID of the default list that you'd like to subscribe users to when you call .identify().                                                                       | [Dynamic List](https://developers.klaviyo.com/en/reference/get_lists)                                                                                                               |

## **Track Event**

| Requiredness | \[Destination Name\] Field (display name) | Segment Default (if any) | Type                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Notes |
| :----------- | :---------------------------------------- | :----------------------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---- |
| Y            | profile                                   |                          | Object                | Properties of the profile that triggered this event.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |       |
| Y            | profile.email                             |                          | String; Format: Email | Individual's email address. Phone Number and/or Email is required.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |       |
| Y            | profile.phone_number                      |                          | String                | Individual's phone number in E.164 format. Phone Number and/or Email is required.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |       |
| N            | profile.other_properties                  |                          | Object                | Other Profile properties to be updated along with the event                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |       |
| Y            | metric_name                               | $.event                  | String                | Name of the event. Must be less than 128 characters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |       |
| Y            | properties                                |                          | Object                | Properties of this event. Any top level property (that are not objects) can be used to create segments. The $extra property is a special property. This records any non-segmentable values that can be references later. For example, HTML templates are useful on a segment, but itself is not used in creating a segment. There are limits placed onto the size of the data present. This must not exceed 5 MB. This must not exceed 300 event properties. A single string cannot be larger than 100 KB. Each array must not exceed 4000 elements. The properties cannot contain more than 10 nested levels. |       |
| N            | time                                      | $.timestamp              | datetime              | When this event occurred. By default, the time the request was received will be used. The time is truncated to the second. The time must be after the year 2000 and can only be up to 1 year in the future.                                                                                                                                                                                                                                                                                                                                                                                                    |       |
|              | value                                     |                          | number                | A numeric value to associate with this event. For example, the dollar amount of a purchase.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |       |
|              | unique_id                                 | $.messageId              | string                | A unique identifier for an event. If the unique_id is repeated for the same profile and metric, only the first processed event will be recorded. If this is not present, this will use the time to the second. Using the default, this limits only one event per profile per second.                                                                                                                                                                                                                                                                                                                           |       |

## **Order Completed**

| Requiredness | \[Destination Name\] Field (display name) | Segment Default (if any) | Type                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Notes |
| :----------- | :---------------------------------------- | :----------------------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---- |
| Y            | profile                                   |                          | Object                | Properties of the profile that triggered this event.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |       |
| Y            | profile.email                             |                          | String; Format: Email | Individual's email address. Phone Number and/or Email is required.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |       |
| Y            | profile.phone_number                      |                          | String                | Individual's phone number in E.164 format. Phone Number and/or Email is required.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |       |
| N            | profile.other_properties                  |                          | Object                | Other Profile properties to be updated along with the event                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |       |
| Y            | metric_name                               |                          | String                | Name of the event. Must be less than 128 characters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |       |
| Y            | properties                                |                          | Object                | Properties of this event. Any top level property (that are not objects) can be used to create segments. The $extra property is a special property. This records any non-segmentable values that can be references later. For example, HTML templates are useful on a segment, but itself is not used in creating a segment. There are limits placed onto the size of the data present. This must not exceed 5 MB. This must not exceed 300 event properties. A single string cannot be larger than 100 KB. Each array must not exceed 4000 elements. The properties cannot contain more than 10 nested levels. |       |
| N            | time                                      | $.timestamp              | datetime              | When this event occurred. By default, the time the request was received will be used. The time is truncated to the second. The time must be after the year 2000 and can only be up to 1 year in the future.                                                                                                                                                                                                                                                                                                                                                                                                    |       |
|              | value                                     |                          | number                | A numeric value to associate with this event. For example, the dollar amount of a purchase.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |       |
|              | unique_id                                 |                          | string                | A unique identifier for an event. If the unique_id is repeated for the same profile and metric, only the first processed event will be recorded. If this is not present, this will use the time to the second. Using the default, this limits only one event per profile per second.                                                                                                                                                                                                                                                                                                                           |       |
|              | products                                  |                          | Object                | List of products purchased in the order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |       |

## **Add to List**

| Requiredness | \[Destination Name\] Field (display name) | Segment Default (if any) | Type   | Description | Notes                                                  |
| :----------- | :---------------------------------------- | :----------------------- | :----- | :---------- | :----------------------------------------------------- |
| Y            | type                                      |                          | string |             |                                                        |
| Y            | email                                     |                          | string | email       |                                                        |
| Y            | list_id                                   |                          | string | List Id     | https://developers.klaviyo.com/en/reference/get\_lists |

## **Remove Profile from List**

| Requiredness | \[Destination Name\] Field (display name) | Segment Default (if any) | Type   | Description | Notes        |
| :----------- | :---------------------------------------- | :----------------------- | :----- | :---------- | :----------- |
| Y            | type                                      |                          | string |             |              |
| Y            | Email                                     |                          | string | Email       |              |
| Y            | list id                                   |                          | string | list_id     | Dynamic list |

##

## **Remove Profile**

| Requiredness | \[Destination Name\] Field (display name) | Segment Default (if any) | Type   | Description | Notes        |
| :----------- | :---------------------------------------- | :----------------------- | :----- | :---------- | :----------- |
| Y            | External Id                               |                          | string |             |              |
| Y            | Email                                     |                          | string | Email       |              |
| Y            | list id                                   |                          | string | list_id     | Dynamic list |

##

# **\`Documentation Notes**

Notes on getting profile id for list APIs. \-\> [List API Notes](https://docs.google.com/document/d/1E1R0mNJ2sT_gyz_IuQFwzGpUSXo1uMxKBTtHRbwVuVU/edit?usp=sharing)
