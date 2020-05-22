---
title: Setting up a blog with Gridsome and Netlify CMS
description: A step-by-step guide to create your own blogging platform from scratch.
draft: true
date: 2020-05-14T10:22:03.035Z
---

Every developer has a moment when he or she decides to start blogging. Usually they make their first steps on a platform like [dev.to](https://dev.to/) or [medium.com](https://medium.com/) but sometimes the ready-made solutions just don't cut it or they wan't to grow their personal brand with a tailored website of their own. If you're motivated by any of those reasons then you're in the right place. Let's create ourselves a blog!

First we need to install Gridsome CLI tool:

```
npm install --global @gridsome/cli
```

We will use the CLI to swiftly create our project. To do this go to your usual workspace directory and run:

```
gridsome create my-blog
```

where "my-blog" is the name of our project. Now change directory to `my-blog` and run:

```
gridsome develop
```

It will spin up our project and open a port on localhost where we will be able to check it out.

Ok, now we need some plugins. Thankfully Gridsome community provided us with a lot of very useful plugins. We need `@gridsome/source-filesystem` to access file system on our machine and `@gridsome/transformer-remark` to interpret that markdown we are gonna write our posts with.

```
npm install @gridsome/source-filesystem @gridsome/transformer-remark
```

After successful installation we have to edit `gridsome.config.js`. It has to look like this:

https://gist.github.com/slawinski/f73d038bd44c9e9794dafa41de6ae313#gridsome.config.js&highlights=7

Noticed the `path` property? It's the directory where we will put our markdown. Oh, and let's not forget to run `gridsome develop` yet again since we've edited both `package.json` and `gridsome.config.js`

Now we have to create few files. In `src/templates` directory create `Post.vue` containing the below: 

https://gist.github.com/slawinski/f73d038bd44c9e9794dafa41de6ae313#Post.vue

It will become the scaffolding on which each of our posts will be built around.

In `/blog` let's create `firstPost.md`.

https://gist.github.com/slawinski/f73d038bd44c9e9794dafa41de6ae313#firstPost

Out posts will be written in markdown and each one has to be in the `/blog` directory.

In `src/components` create `PostList.vue` 

https://gist.github.com/slawinski/f73d038bd44c9e9794dafa41de6ae313#PostList.vue

That component will render a list of all posts available from the `/blog` folder. We can put it anywhere but let's put it in `Index.vue`. 

Good job, we got ourselves a blog! Check your localhost to see the results. 

Now let's host it so it is accessible to everybody in the whole world. For that let's use Netlify.

Go to netlify.com, log in, create new, add form github, build command `gridsome build`, publish directory `dist`

Great. Adding new posts now looks like this: we need to write a post in markdown, put it in the /blog directory, commit and push changes. Seems like a lot of fuss for such a simple task. Let's add a headless CMS to our blog to make it easier. The following steps will enable Netlify CMS in our blog but there's plenty of other CMS providers.

Create `config.yml` and `index.html` in `/static/admin` 

https://gist.github.com/slawinski/f73d038bd44c9e9794dafa41de6ae313#config.yml

https://gist.github.com/slawinski/f73d038bd44c9e9794dafa41de6ae313#index.html

and `index.html` in `/src`

https://gist.github.com/slawinski/8e1d39d9ef90f48abeec9408b2f0bcda#index.html

Then we need to commit and push.

On Netlify we have to go to the `Identity` tab and click `Enable Identity` button. Then under `Settings and usage` we should select `invite only` and enable `Git gateway`. After that we can invite users who can edit our blog under `Invite users` in the `Identity` tab.

After confirming email address we should have access to the admin panel. Let's edit the URL by adding `/admin` at the end. We can now choose password and edit our blog through the browser.