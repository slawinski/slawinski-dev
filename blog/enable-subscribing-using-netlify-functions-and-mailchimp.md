---
title: Email subscription using Netlify Functions and ConvertKit
description: Users handover their email addresses through a form and serverless
  function feeds them to an email marketing tool API.
draft: true
date: 2020-05-31T19:15:45.030Z
---
This tutorial is strongly inspired by the work of people behind https://codegregg.com/blog/netlifyMailchimpFunction/. They deserve all the credit.

Instal Netlify CLI

```
npm i -g netlify-cli
```

Create folder for functions in your root directory and put a .js file inside

```
touch /functions/subscribe/subscribe.js
```

Let's include subfolders in case later we'll be using more than one serverless function.

Let's also use the fact that Netlify can install packages during its build process and in the `subscribe` folder run:

```
npm init -y
```

This will setup package.json just for the subscribe.js and will enable us to now run:
```
npm i axios
```

Because we'll be using it in out function, which is following:
https://gist.github.com/slawinski/88c5d8a3df4f4d37634f3e73c45ec368#subscribe.js

Next in project root run:

```
netlify init
```

In project root create `netflify.toml`:

https://gist.github.com/slawinski/88c5d8a3df4f4d37634f3e73c45ec368#netlify.toml

Then, again i project root install:

```
npm i netlify-lambda
```

And add postinstall script in you root `package.json`

https://gist.github.com/slawinski/88c5d8a3df4f4d37634f3e73c45ec368#package.json

Lastly run:

```
npm i
```

And you're all set to collect emails from visitors kind enought to provide it to you!

P.S. To locally test that function run:

```
netlify dev
```

This will spin up the project connected with netlify including your functions and API keys.




