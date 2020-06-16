<template>
  <div class="mb-32">
    <g-link :to="post.path">
      <h1
        class="text-headline leading-none font-sans font-bold tracking-tight text-4xl sm:text-7xl hover:text-gray-700 pb-8"
      >
        {{ post.title }}
      </h1>
    </g-link>
    <p class="text-paragraph font-body leading-tight text-2xl">
      {{ post.description }}
    </p>
  </div>
</template>

<script>
export default {
  props: {
    post: {
      type: Object,
      default: () => {},
    },
  },
};
</script>
