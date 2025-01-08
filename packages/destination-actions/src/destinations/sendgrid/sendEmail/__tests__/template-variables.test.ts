import { extractVariables } from '../dynamic-fields'

const emailTemplate = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email Template</title>
    </head>
    <body>
        <!-- Header -->
        <h1>Welcome to Test Email Template!</h1>

        <!-- Main Content -->
            <h2>Welcome, {{user.username}}!</h2>
            
            <p>Thank you for joining <strong>{{user.leagueName}}</strong>! Your current leagues are:</p>
            
            <p>Hello {{insert name "default=Customer"}}! Thank you for contacting us about {{insert businessName "your big business"}}.</p>
            <p>Hello {{insert name "default=Customer"}}! Thank you for contacting us about {{insert businessName 'your small business' "x = this text should not become variable" }}.</p>
            {{root.user.username | default: "Unknown"}}
            <ul>
              {{#each user.currentLeagues}}
                <li><strong>{{this.leagueName}}: {{this.leagueParticipants}} members</strong></li>
              {{/each}}
            </ul>

              <a href="{{login_url}}">My Leagues</a>
              <p>{{insert name "default=Customer"}}</p>
              {{#if user.profile.male}}
                <p>Dear Sir</p>
              {{else if user.profile.female}}
                <p>Dear Madame</p>
              {{else}}
                <p>Dear Customer</p>
              {{/if}}

              {{#if user.suspended}}
                <p>Warning! Your account is suspended, please call: {{@root.supportPhone}}</p>
              {{/if}}

              {{#unless user.active}}
                <p>Warning! Your account is suspended, please call: {{@root.supportPhone}}</p>
              {{/unless}}

              <p>
              {{#greaterThan scoreOne scoreTwo}}
                  Congratulations, you have the high score today!
              {{/greaterThan}}
              </p>

              <p>
              {{#greaterThan scoreOne scoreTwo}}
                  Congratulations, you have the high score today!
              {{else}}
                  You were close, but you didn't get the high score today.
              {{/greaterThan}}
              </p>

              {{#lessThan scoreOne scoreTwo}}

              <p>
              {{#lessThan scoreOne scoreTwo}}
                  You were close, but you didn't get the high score today.
              {{else}}
                  Congratulations, you have the high score today!
              {{/lessThan}}
              </p>

              <p>
              {{#equals customerCode winningCode}}
                  You have a winning code.
              {{/equals}}
              </p>

              <p>
              {{#equals customerCode winningCode}}
                  You have a winning code.
              {{else}}
                  You do not have a winning code.
              {{/equals}}
              </p>

              <p>
              {{#notEquals currentDate appointmentDate}}
                  Your appointment is not today.
              {{/notEquals}}
              </p>

              <p>
              {{#notEquals currentDate appointmentDate}}
                  Your appointment is not today.
              {{else}}
                  Your appointment is today.
              {{/notEquals}}
              </p>

              <p>
              {{#and favoriteFood favoriteDrink}}
                Thank you for letting us know your dining preferences.
              {{/and}}.
              </p>

              <p>
              {{#and favoriteFood favoriteDrink}}
                Thank you for letting us know your dining preferences.
              {{else}}
                If you finish filling out your dining preferences survey, we can deliver you recipes we think you'll be most interested in.
              {{/and}}.
              </p>

              <p>
              {{#or isRunner isCyclist}}
                We think you might enjoy a map of trails in your area.
              {{/or}}.
              </p>
              <p>
              {{#or isRunner isCyclist}}
                We think you might enjoy a map of trails in your area. You can find the map attached to this email.
              {{else}}
                We'd love to know more about the outdoor activities you enjoy. The survey linked below will take only a minute to fill out.
              {{/or}}.
              </p>

              <p>
              {{#greaterThan (length cartItems) 0}}
              It looks like you still have some items in your shopping cart. Sign back in to continue checking out at any time.
              {{else}}
              Thanks for browsing our site. We hope you'll come back soon.
              {{/greaterThan}}
              </p>

              <ol>
                {{#each user.orderHistory}}
                <li>You ordered: {{this.item}} on: {{this.date}}</li>
                {{/each}}
              </ol>

              {{#each user.story}}
                {{#if this.male}}
                    <p>{{this.date}}</p>
                {{else if this.female}}
                    <p>{{this.item}}</p>
                {{/if}}
              {{/each}}

              {{#each user.story}}
                {{#if this.male}}
                    {{#if this.date}}
                      <p>{{this.date}}</p>
                    {{/if}}
                    {{#if this.item}}
                      <p>{{this.item}}</p>
                    {{/if}}
                {{else if this.female}}
                    {{#if this.date}}
                      <p>{{this.date}}</p>
                    {{/if}}
                    {{#if this.item}}
                      <p>{{this.item}}</p>
                    {{/if}}
                {{/if}}
              {{/each}}

              {{#if people}}
                <p>People:</p>
                {{#each people}}
                    <p>{{this.name}}</p>
                {{/each}}
              {{/if}}
            
        <!-- Footer -->
            <p>© 2024 Testing Templates blah, Inc. All rights reserved. {{formatDate timeStamp dateFormat}}</p>          
    </body>
  </html>`

describe('Sendgrid.sendEmail', () => {
  it('dynamic tokens should be extracted from template correctlly', async () => {
    const tokens = extractVariables(emailTemplate)
    expect(tokens).toMatchObject([
      'user',
      'name',
      'businessName',
      'login_url',
      'supportPhone',
      'scoreOne',
      'scoreTwo',
      'customerCode',
      'winningCode',
      'currentDate',
      'appointmentDate',
      'favoriteFood',
      'favoriteDrink',
      'isRunner',
      'isCyclist',
      'cartItems',
      'people',
      'timeStamp',
      'dateFormat'
    ])
  })
})
