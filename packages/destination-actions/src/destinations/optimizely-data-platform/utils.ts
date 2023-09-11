
export const hosts: { [key: string]: string; } = {
  "US": "https://function.zaius.app/twilio_segment",
  "EU": "https://function.eu1.ocp.optimizely.com/twilio_segment",
  "AU": "https://function.au1.ocp.optimizely.com/twilio_segment"
};

export const getEmailEventType: { [key: string]: string; } = {
  'Email Delivered': 'sent',
  'Email Opened': 'open',
  'Email Link Clicked': 'click',
  'Unsubscribed': 'opt-out',
  'Email Marked as Spam': 'spam_complaint'
};
