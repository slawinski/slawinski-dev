---
title: Email subscribing using Netlify Functions and ConvertKit
description: Allow users to subscribe to your blog. Make a collection of your
  users emails. Make a subscribe form
draft: true
date: 2020-05-16T09:01:58.082Z
---
https://codegregg.com/blog/netlifyMailchimpFunction/

Mail chimp will require your address from you. Have in mind that some of the double opt-in message templates have a field containing that address so if you enable double-opt in you might inadvertenlny send your address to your audience.

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


