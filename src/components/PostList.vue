<template>
  <div class="mb-32">
    <g-link :to="post.path" >
      <h1 class="text-headline leading-none font-publicsans font-bold tracking-tight text-4xl sm:text-7xl hover:text-gray-700 pb-8" v-html="post.title" />
    </g-link>
    <p class="text-paragraph font-ptsans leading-tight text-3xl" v-html="post.description"/>
  </div>
</template>

<script>
  export default {
    props: ["post"],
  };
</script>