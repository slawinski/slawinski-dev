<template>
  <Layout>
    <h1
      class="text-headline leading-none font-sans font-bold tracking-tight text-4xl sm:text-7xl mb-10"
    >
      Check out what I've been up to lately
    </h1>
    <ProjectList />
  </Layout>
</template>

<script>
import ProjectList from '../components/ProjectList';

export default {
  metaInfo: {
    title: 'Projects',
  },
  components: {
    ProjectList,
  },
  methods: {
    tags(string) {
      return string.split(', ');
    },
  },
};
</script>
