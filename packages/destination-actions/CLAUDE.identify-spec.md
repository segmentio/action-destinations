# The table below lists predefined Segment traits

| Trait         | Type      | Description                                                                                   |
| ------------- | --------- | --------------------------------------------------------------------------------------------- |
| `id`          | string    | Unique ID in your database for the user.                                                      |
| `email`       | string    | Email address of the user.                                                                    |
| `name`        | string    | Full name of the user. If only first and last name are provided, Segment auto-fills this.     |
| `first_name`  | string    | First name of the user.                                                                       |
| `last_ame`    | string    | Last name of the user.                                                                        |
| `username`    | string    | User’s unique username, e.g., Twitter or GitHub handle.                                       |
| `phone`       | string    | Phone number of the user.                                                                     |
| `avatar`      | string    | URL to an avatar image for the user.                                                          |
| `birthday`    | date-time | User’s birthday.                                                                              |
| `gender`      | string    | Gender of the user.                                                                           |
| `title`       | string    | Job title or role of the user.                                                                |
| `description` | string    | Description of the user.                                                                      |
| `website`     | string    | Website of the user.                                                                          |
| `age`         | integer   | Age of the user.                                                                              |
| `address`     | object    | Street address optionally containing: city, country, postal_ode, state, or street.            |
| `company`     | object    | Company the user represents, optionally containing: name, id, industry, employee_count, plan. |
| `created_at`  | date-time | Date the user’s account was first created (ISO-8601 format).                                  |
