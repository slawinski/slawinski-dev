---
title: Netlify Functions with npm packages
description: How to write serverless functions with npm packages without committing node_modules
date: 2020-06-14T13:06:30.174Z
---
Let's assume that you already have an app deployed to Netlify. Now, install Netlify CLI

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

This will setup package.json just for the myFunction directory and will enable us to install packages

```bash
npm i <package_name>
```

Because we'll be using it in our `myFunction.js`, which may look like this:

```javascript
// some code I yet haven't written
```

Then, again in project root install:

```bash
npm i netlify-lambda
```

[netlify-lambda](https://github.com/netlify/netlify-lambda) is, as per documentation:
>an optional tool that helps with building or locally developing Netlify Functions with a simple webpack/babel build step. For function folders, there is also a small utility to install function folder dependencies.

Next add postinstall script in you root's `package.json`

```json
{
  "scripts": {
    "postinstall": "netlify-lambda install",
  },
}
```
`netlify-lambda install` is a utility function for isntalling dependencies either locally or during build process.

Lastly run:

```bash
npm i
```

And you're all set to use your Netlify Function!

P.S. To locally test that function run:

```bash
netlify dev
```

This will spin up the project connected with Netlify including your functions and API keys (if you have any).
