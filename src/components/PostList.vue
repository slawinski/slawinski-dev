<template>
  <div class="pb-10">
    <h1 v-html="post.title" />
    <h6 v-html="post.date"/>
    <p v-html="post.description"/>
    <g-link :to="post.path" >Read More...</g-link>
  </div>
</template>

<script>
  export default {
    props: ["post"],
  };
</script>