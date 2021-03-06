---
title: Email subscription using Netlify Functions and ConvertKit
description: Collect email addresses using serverless functions and ConvertKit
date: 2020-05-31T19:15:45.030Z
---
This tutorial is strongly inspired by the work of people behind [https://codegregg.com/](https://codegregg.com/blog/netlifyMailchimpFunction/). They deserve all the credit.

If you want to learn more about serverless functions provided by Netlify I recommend [Netlify Lambda Functions Tutorial](https://flaviocopes.com/netlify-functions/) and [AWS (?) made simple: What is a Netlify function?](https://tlakomy.com/create-a-netlify-function-from-scratch) blog post.

## Create ConvertKit account and get the API key

I find ConvertKit the most developer-friendly transactional email service since they allow you to put their physical address in your messages (CAN-SPAM requirement to have a physical address in every email you send). For details please refer to (Alternatives for your physical address)[https://help.convertkit.com/en/articles/2502494-alternatives-for-your-physical-address]

## Create a serverless function

Create a folder for functions in your root directory and put a .js file inside

```bash
touch /functions/subscribe/subscribe.js
```

Let's include subfolders in case later we'll be using more than one serverless function.

Let's also use the fact that Netlify can install packages during its build process and in the `subscribe` folder initiate package.json:

```bash
npm init -y
```

This will setup package.json just for the `/subscribe` and will enable us to install packages in a subfolder:

```bash
npm i axios
```

We'll be using this package in our `subscribe.js` function, which is following:

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

And add postinstall script in your root's `package.json`

```json
{
  "scripts": {
    "postinstall": "netlify-lambda install",
  },
}
```

Lastly, run:

```bash
npm i
```

## Set up environmental variables in Netlify

In your project's panel on Netlify, in the Settings section fill in your environmental variables.

And you're all set to collect emails from visitors kind enough to provide it to you!

P.S. To locally test that function run:

```bash
netlify dev
```

This will spin up the project connected with Netlify including your functions and API keys.
