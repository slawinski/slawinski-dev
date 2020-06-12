---
title: Sending emails using Netlify Functions and Sendgrid
description: Start sending email form your website using Netlify Functions and Sendgrid
draft: true
date: 2020-06-12T09:47:49.449Z
---
The below guide was heavily inspired by the team behind [https://rosso.codes](https://rosso.codes/blog/send-email-using-netlify-functions-and-sendgrid-api/). They deserve all the credit.

## Create Sendgrid account

Remember that besides API key a user also has to do "Sender Authentication" and if she/he chooses "Single Sender Verification" then the `from` and `to` emails from your snippet have to be the same [reference 1](https://sendgrid.com/docs/ui/account-and-settings/how-to-set-up-domain-authentication/), [reference 2](https://sendgrid.com/docs/for-developers/sending-email/sender-identity/).

## Write Netlify function

Create directory `/functions/sendmail/

In the new directory initiate package.json and install Sendgrid.

```bash
npm i -y && npm install --save @sendgrid/mail
```

In the same directory create `sendmail.js`

```javascript
const client = require('@sendgrid/mail');
const {
  SENDGRID_API_KEY,
  SENDGRID_TO_EMAIL,
  SENDGRID_FROM_EMAIL,
} = process.env;

exports.handler = async function (event, context, callback) {
  const { message, senderEmail, senderName } = JSON.parse(event.body);
  client.setApiKey(SENDGRID_API_KEY);

  const data = {
    to: SENDGRID_TO_EMAIL,
    from: SENDGRID_FROM_EMAIL,
    subject: `New message from ${senderName} (${senderEmail})`,
    html: message,
  };

  try {
    await client.send(data);
    return {
      statusCode: 200,
      body: 'Message sent',
    };
  } catch (err) {
    return {
      statusCode: err.code,
      body: JSON.stringify({ msg: err.message }),
    };
  }
};
```

In your project's panel on Netlify, in Settings section fill in you environmental variables.