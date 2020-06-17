---
title: Sending emails using Netlify Functions and Sendgrid
description: Start sending email form your website using Netlify Functions and Sendgrid
date: 2020-06-12T09:47:49.449Z
---
The below guide was heavily inspired by the team behind [https://rosso.codes](https://rosso.codes/blog/send-email-using-netlify-functions-and-sendgrid-api/). They deserve all the credit.

If you want to learn more about serverless functions provided by Netlify I recommend [Netlify Lambda Functions Tutorial](https://flaviocopes.com/netlify-functions/) and [AWS (?) made simple: What is a Netlify function?](https://tlakomy.com/create-a-netlify-function-from-scratch) blog post.

## Create Sendgrid account and get the API key

Remember that besides API key a user also has to do "Sender Authentication" and if she/he chooses "Single Sender Verification" then the `from` and `to` emails from your snippet have to be the same. For more information please refer to: [How to set up domain authentication](https://sendgrid.com/docs/ui/account-and-settings/how-to-set-up-domain-authentication/) and [Sender Identity](https://sendgrid.com/docs/for-developers/sending-email/sender-identity/).

## Create serverless function

Create folder for functions in your root directory and put a .js file inside

```bash
touch /functions/sendmail/sendmail.js
```

Let's include subfolders in case later we'll be using more than one serverless function.

Let's also use the fact that Netlify can install packages during its build process and in the `sendmail` folder initiate package.json:

```bash
npm init -y
```

This will setup package.json just for the `/sendmail` and will enable us to install packages in subfolder:

```bash
npm install --save @sendgrid/mail
```

Now the `sendmail.js`:

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

## Configure Netlify boilerplate

Install Netlify CLI

```bash
npm i -g netlify-cli
```

Next in project root run:

```bash
netlify init
```

In project root create `netflify.toml`:

```toml
[build]
  publish = "dist"
  functions = './functions/'
```

Then, again in project root install:

```bash
npm i netlify-lambda
```

And add postinstall script in you root's `package.json`

```json
{
  "scripts": {
    "postinstall": "netlify-lambda install",
  },
}
```

Lastly run:

```bash
npm i
```

## Set up environmental variables in Netlify

In your project's panel on Netlify, in Settings section fill in you environmental variables.

And you're all set to send emails from your contact form!

P.S. To locally test that function run:

```bash
netlify dev
```

This will spin up the project connected with Netlify including your functions and API keys.
