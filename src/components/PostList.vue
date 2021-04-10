<template>
  <div class="mb-32">
    <g-link :to="post.path">
      <h1
        class="underline--magical text-headline leading-none font-sans font-bold tracking-tight text-4xl sm:text-7xl pb-8"
      >
        {{ post.title }}
      </h1>
    </g-link>
    <p class="text-paragraph font-sans leading-tight text-2xl">
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

<style scoped lang="scss">
.underline--magical {
  background-image: linear-gradient(120deg, #ff8e3c, #d9376e);
  background-repeat: no-repeat;
  background-size: 100% 0.1em;
  background-position: 0 88%;
  transition: background-size 0.25s ease-in;

  &:hover {
    background-size: 25% 100%;
  }
}
</style>
