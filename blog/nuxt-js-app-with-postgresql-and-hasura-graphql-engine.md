---
title: Nuxt.js app with PostgreSQL databse and Hasura GraphQL Engine
description: Here you will find how to connect PostgreSQL database to a basic
  Nuxt.js app using GraphQL server from Hasura and enable basic CRUD operations.
date: 2020-06-08T05:58:02.397Z
---
Go to hasura and spin up a heroku app with postgres database. It's all explained in Hasura docs: [Quickstart with Heroku](https://hasura.io/docs/1.0/graphql/manual/getting-started/heroku-simple.html)

Next let's create [Nuxt.js](https://nuxtjs.org/guide/installation) app:

```bash
npx create-nuxt-app <project-name>
```

Install @nuxt/apollo and graphql-tag

```bash
npm install @nuxt/apollo graphql-tag --save
```

Add basic config in `nuxt.config.js`:

```javascript
 apollo: {
   clientConfigs: {
     default: {
       httpEndpoint: 'https://hasura-movie-database.herokuapp.com/v1/graphql',
       wsEndpoint: 'wss://hasura-movie-database.herokuapp.com/v1/graphql',
     },
   },
 },
```

Let's prepare a template in `/pages/index.vue`:

```vue
<template>
  <div>
    <div>
      <h1>
        a basic movie database part deux
      </h1>
      <form>
        <input
          v-model="lookupMovie"
          type="text"
          placeholder="Enter movie title"
          required
        />
        <button
          type="submit"
          @click.prevent="submit"
        >
          Submit
        </button>
      </form>
      <div>
        <div v-for="movie in movies" :key="movie.id">
          <div>
          {{ movie.title }} ({{ movie.year }})
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

Write graphql queries (query, mutation, subscription)

```vue
<script>
import axios from 'axios';
import gql from 'graphql-tag';

export default {
  apollo: {
    movies: {
      query: gql`
        query getMovies {
          movies {
            id
            title
            year
            poster
            plot
          }
        }
      `,
      update(data) {
        return data.movies;
      },
    },
  },
};
</script>
```


