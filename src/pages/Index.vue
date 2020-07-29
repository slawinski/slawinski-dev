<template>
  <Layout>
    <section>
      <PostList
        v-for="edge in $page.allPost.edges"
        :key="edge.node.id"
        :post="edge.node"
      />
    </section>
  </Layout>
</template>

<page-query>
query {
  allPost {
    edges {
      node {
        path
        title
        content
        description
        date (format: "D MMMM YYYY")
      }
    }
  }
}
</page-query>

<script>
import PostList from '~/components/PostList';

export default {
  components: {
    PostList,
  },
  metaInfo: {
    title: 'Home',
  },
};
</script>
