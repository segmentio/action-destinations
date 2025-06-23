// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Use either your default transactional email from address, or another custom from address you have added to your account. If you set a from address that is not listed in your available from addresses, Dotdigital will replace it with your default from address. You may set a from name as well as an email address, for example "My Company <`Dotmailer123@r1.dotdigital-email.com`>". [Read more about using transactional email](https://support.dotdigital.com/en/articles/8199068-use-transactional-email).
   */
  fromAddress: string
  /**
   * The email address(es) to send to.
   */
  toAddresses: string
  /**
   * The subject line for your email.
   */
  subject: string
  /**
   * The HTML content for your email.
   */
  htmlContent: string
  /**
   * The plain text content for your email.
   */
  plainTextContent?: string
  /**
   * The CC email address(es) to send to. Separate email addresses with a comma. Maximum: 100.
   */
  ccAddresses?: string
  /**
   * The BCC email address(es) to send to. Separate email addresses with a comma. Maximum: 100.
   */
  bccAddresses?: string
}
