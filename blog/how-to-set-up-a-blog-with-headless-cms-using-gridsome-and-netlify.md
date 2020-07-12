---
title: Setting up a blog with Gridsome and Netlify CMS
description: A step-by-step guide to create your own blogging platform from scratch
date: 2020-05-14T10:22:03.035Z
---

Every developer has a moment when he or she decides to start blogging. Usually they make their first steps on a platform like [dev.to](https://dev.to/) or [medium.com](https://medium.com/) but sometimes the ready-made solutions just don't cut it or they wan't to grow their personal brand with a tailored website of their own. If you're motivated by any of those reasons then you're in the right place. Let's create ourselves a blog!

## Create the blog

First we need to install Gridsome CLI tool:

```bash
npm install --global @gridsome/cli
```

We will use the CLI to swiftly create our project. To do this go to your usual workspace directory and run:

```bash
gridsome create my-blog
```

where "my-blog" is the name of our project. Now change directory to `my-blog` and run:

```bash
gridsome develop
```

It will spin up our project and open a port on localhost where we will be able to check it out.

Ok, now we need some plugins. Thankfully Gridsome community provided us with a lot of very useful plugins. We need `@gridsome/source-filesystem` to access file system on our machine and `@gridsome/transformer-remark` to interpret that markdown we are gonna write our posts with.

```bash
npm install @gridsome/source-filesystem @gridsome/transformer-remark
```

After successful installation we have to edit `gridsome.config.js`. It has to look like this:

```javascript
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

Noticed the `path` property? It's the directory where we will put our markdown. Oh, and let's not forget to run `gridsome develop` yet again since we've edited both `package.json` and `gridsome.config.js`

Now we have to create few files. In `src/templates` directory create `Post.vue` containing the below:

```vue
<template>
  <Layout>
    <div>
      <h1 v-html="$page.post.title"/>
      <div v-html="$page.post.content"/>
    </div>
  </Layout>
</template>

<page-query>
query Post ($path: String!) {
  post: post (path: $path) {
    title
    content
    date (format: "D MMMM YYYY")

  }
}
</page-query>
```

It will become the scaffolding on which each of our posts will be built around.

In `/blog` let's create `firstPost.md`.

```markdown
---
title: First Post
---

This is the **first** post on my blog!
```

Out posts will be written in markdown and each one has to be in the `/blog` directory.

In `src/components` create `PostList.vue`

```vue
<template>
  <div class="mb-32">
    <g-link :to="post.path" >
      <h1 v-html="post.title"/>
    </g-link>
    <p v-html="post.description"/>
  </div>
</template>

<script>
  export default {
    props: ["post"],
  };
</script>
```

That component will render a list of all posts available from the `/blog` folder. We can put it anywhere but let's put it in `Index.vue`.

Good job, we got ourselves a blog! Check your localhost to see the results.

## Deploying on Netlify

Now let's host it so it is accessible to everybody in the whole world. For that let's use Netlify.

Go to [netlify.com](https://www.netlify.com/), log in, create new, add from github, build command `gridsome build`, publish directory `dist`

Great. Adding new posts now looks like this: we need to write a post in markdown, put it in the /blog directory, commit and push changes. Seems like a lot of fuss for such a simple task. Let's add a headless CMS to our blog to make it easier.

## Adding Netlify CMS

The following steps will enable Netlify CMS in our blog but there's plenty of other CMS providers.

Create `config.yml` and `index.html` in `/static/admin`

```yml
# /static/admin/config.yml

backend:
  name: git-gateway
  branch: master # Branch to update (optional; defaults to master)

media_folder: "static/uploads"
public_folder: "/uploads"

collections:
  - name: "blog" # Used in routes, e.g., /admin/collections/blog
    label: "Blog" # Used in the UI
    folder: "blog" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    slug: "{{slug}}" # Filename template, e.g., YYYY-MM-DD-title.md
    fields: # The fields for each document, usually in front matter
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Description", name: "description", widget: "text"}
      - {label: "Publish Date", name: "date", widget: "datetime"}
      - {label: "Body", name: "body", widget: "markdown"}
```

```html
<!-- /static/admin/index.html -->

<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
<!-- Include the script that builds the page and powers Netlify CMS -->
<script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
</body>
</html>
```

and `index.html` in `/src`

```html
<!-- /src/index.html -->

<!DOCTYPE html>
<html ${htmlAttrs}>
<head>
  ${head}
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body ${bodyAttrs}>
${app}
${scripts}
<script>
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/admin/";
        });
      }
    });
  }
</script>
</body>
</html>
```

Then we need to commit and push.

On Netlify we have to go to the `Identity` tab and click `Enable Identity` button. Then under `Settings and usage` we should select `invite only` and enable `Git gateway`. After that we can invite users who can edit our blog under `Invite users` in the `Identity` tab.

After confirming email address we should have access to the admin panel. Let's edit the URL by adding `/admin` at the end. We can now choose password and edit our blog through the browser.
