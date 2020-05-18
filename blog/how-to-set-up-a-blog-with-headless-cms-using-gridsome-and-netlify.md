---
title: Setting up a blog with Gridsome and Netlify CMS
description: A step-by-step guide to create your own blogging platform from scratch.
draft: true
date: 2020-05-14T10:22:03.035Z
---
Every developer has a moment when he or she decides to start blogging. Usually they make their first steps on a platform like dev.to or medium.com but sometimes the ready-made solution just doesn't cut it or they wan't to grow their personal brand with a tailored website of their own. If you're motivated by any of those reasons then you're in the right place. Let's create a blog!

First we need to install Gridsome CLI tool:

```
npm install --global @gridsome/cli
```

We will use its automated workflow to quickly create our project. To do this `cd` to your usual workspace dirsctory and run:

```
gridsome create my-blog
```

where "my-blog" is the name of our project. Now change directory to our new blog:

```
cd my-blog
```

and run:

```
gridsome develop
```

this will spin up our project and open a port on localhost where we will be able to check it out.

Ok, now we need some plugins. Thankfully Gridsome community provided us with a lot of very useful plugins. We need `@gridsome/source-filesystem` to access file system on our machine and `@gridsome/transformer-remark` to interpret that markdown we are gonna write our posts with.

```
npm install @gridsome/source-filesystem @gridsome/transformer-remark
```

After successful installation we have to edit `gridsome.config.js`. It has to look like this:

```
module.exports = {
  siteName: 'my-blog',
  plugins: [
    {
      use: '@gridsome/source-filesystem',
      options: {
        path: 'blog/**/*.md',
        typeName: 'Post',
        remark: {
          // remark options
        }
      }
    }
  ],
  transformers: {
    remark: {
      // global remark options
    }
  }
}
```
Notice the `path` property? It's the directory where we will put our markdown.

Now we have to create few files. In `src/templates` directory create `Post.vue`, in `src/components` create `PostList.vue` and in `/blog` create `firstPost.md`.



5. Create repo and push
6. Go to netlify, create new, add form github, build command `gridsome build`, publish directory `dist`
7. Create `config.yml` and `index.html` in `/static/admin` and `index.html` in `/src`
8. Commit and push
9. On netlify:

indentity > enable identity > settings and usage > invite only 

indentity > enable identity > settings and usage > enable git gateway

indentity > invite users
10. Confirm email, set a password and go to `/admin` url