---
title: Email subscription using Netlify Functions and ConvertKit
description: Users handover their email addresses through a form and serverless
  function feeds them to an email marketing tool API.
draft: true
date: 2020-05-31T19:15:45.030Z
---
This tutorial is strongly inspired by the work of people behind https://codegregg.com/blog/netlifyMailchimpFunction/. They deserve all the credit.
If you want to learn more about serverless functions provided by Netlify I recommend this blog post https://flaviocopes.com/netlify-functions/.

Instal Netlify CLI

```bash
npm i -g netlify-cli
```

Create folder for functions in your root directory and put a .js file inside

```bash
touch /functions/subscribe/subscribe.js
```

Let's include subfolders in case later we'll be using more than one serverless function.

Let's also use the fact that Netlify can install packages during its build process and in the `subscribe` folder run:

```bash
npm init -y
```

This will setup package.json just for the subscribe.js and will enable us to now run:
```bash
npm i axios
```

Because we'll be using it in out function, which is following:

```javascript
const axios = require('axios');

const { CONVERTKIT_API_KEY } = process.env;

exports.handler = async (event, context) => {
  const { email } = JSON.parse(event.body);

  const subscriber = {
    api_key: CONVERTKIT_API_KEY,
    email: email,
  };

  try {
    await axios.post(
      'https://api.convertkit.com/v3/forms/1405772/subscribe',
      subscriber,
    );
    return {
      statusCode: 200,
      body: 'Email subscribed',
    };
  } catch (err) {
    return {
      statusCode: err.code,
      body: JSON.stringify({ msg: err.message }),
    };
  }
};
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

Then, again i project root install:

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

And you're all set to collect emails from visitors kind enought to provide it to you!

P.S. To locally test that function run:

```bash
netlify dev
```

This will spin up the project connected with netlify including your functions and API keys.
