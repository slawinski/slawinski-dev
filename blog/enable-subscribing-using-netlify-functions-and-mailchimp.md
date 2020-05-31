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
~/functions/subscribe.js
```

You might want to include subfolders if using more than one serverless functions.

Let's use the fact that Netlify can install packages during its build process (otherwise we would have to commit node_modules if the functions utilizes any npm packages) and run:

```
npm init -y
```

In the function folder.
axios from root node_modules? check if node-fetch better

