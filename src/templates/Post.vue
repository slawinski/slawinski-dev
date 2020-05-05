<template>
  <Layout>
    <div>
      <g-link to="/">  &larr; Go Back</g-link>
      <h1 v-html="$page.post.title" />
      <div v-html="$page.post.content"/>
    </div>
  </Layout>
</template>

<page-query>
query Post ($path: String!) {
  post: post (path: $path) {
    title
    content
  }
}
</page-query>