---
title: Netlify Functions with npm packages
description: How to write serverless functions with npm packages without
  committing `node_modules`
date: 2020-06-14T13:06:30.174Z
---
Instal Netlify CLI

```bash
npm i -g netlify-cli
```

Create folder for functions in your root directory and put a .js file inside

```bash
touch /functions/MyFunction/myFunction.js
```

Let's include subfolders in case later we'll be using more than one serverless function.

Let's also use the fact that Netlify can install packages during its build process and in the `subscribe` folder run:

```bash
npm init -y
```

This will setup package.json just for the myFunction.js and will enable us to install packages

```bash
npm i [package_name]
```

Because we'll be using it in our `myFunction.js`, which may look like this:

```javascript
// some code I yet haven't written
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

And you're all set to hit your endpoint either in browser or in Postman.

P.S. To locally test that function run:

```bash
netlify dev
```

This will spin up the project connected with Netlify including your functions and API keys.