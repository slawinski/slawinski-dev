---
title: Nuxt.js app with Hasura GraphQL Engine
description: Connect Postgres database with a Nuxt.js app using GraphQL server from Hasura
date: 2020-06-12T10:59:32.126Z
---
## Create a Postgres database on Heroku

Go to hasura and spin up a heroku app with postgres database. It's all explained in Hasura docs: [Quickstart with Heroku](https://hasura.io/docs/1.0/graphql/manual/getting-started/heroku-simple.html)

Using the GUI create a table `movies` and add following fields to it:

```
title - text
id - uuid, primary key, unique, default: gen_random_uuid()
year - text, nullable
poster - text, nullable
plot - text, nullable
```

Feed it some sample data (`poster` field should be a link to some jpeg) and move to the next chapter.

## Create Nuxt.js app

Next let's create [Nuxt.js](https://nuxtjs.org/guide/installation) app (there are no preferences towards answers for the questions):

```bash
npx create-nuxt-app nuxt-movie-database
```

Install @nuxt/apollo and graphql-tag

```bash
npm install @nuxt/apollo graphql-tag --save
```

## Configure Apollo client

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
The `ws` stands for websockets and will be required further on to subscribe to changes in the database.

## Write some querries

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
          aria-label="Movie title"
          required
        />
        <button type="submit" @click.prevent="submit" @keydown="submit">
          Submit
        </button>
      </form>
      <div>
        <div v-for="movie in movies" :key="movie.id">
          <div>
            <div>
              <img :src="movie.poster" alt="Movie poster" />
            </div>
            <div>
              <div>{{ movie.title }} ({{ movie.year }})</div>
              <p>
                {{ movie.plot }}
              </p>
              <button @click.prevent="remove(movie)" @keydown="remove(movie)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

It's not very pretty, but we're not here to enjoy the views.

Now write graphql queries (query for reading the data, mutation for writing/deleting the data and subscription to update the app whenever a change in the database is detected)

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
      subscribeToMore: {
        document: gql`
          subscription mySubscription {
            movies {
              id
              title
              year
              poster
              plot
            }
          }
        `,
        updateQuery: (previousResult, { subscriptionData }) => {
          return subscriptionData.data;
        },
      },
    },
  },
  methods: {
    remove(movie) {
      this.$apollo.mutate({
        mutation: gql`
          mutation removeMovie($id: uuid!) {
            delete_movies(where: { id: { _eq: $id } }) {
              affected_rows
            }
          }
        `,
        variables: {
          id: movie.id,
        },
      });
    },
  }
};
</script>
```
TADAA! If we didn't mess up our app then you should see your sample movies listed in your browser.
