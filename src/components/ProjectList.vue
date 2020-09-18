<template>
  <div class="flex flex-wrap">
    <ProjectCard
      v-for="project in $static.projects"
      :key="project.id"
      class="mb-8 mr-4"
      :project="project"
    ></ProjectCard>
  </div>
</template>

<static-query>
query getProjects {
  projects {
    id
    project_name
    description
    tags
    thumbnail
    github_link
    website_link
  }
}
</static-query>

<script>
import ProjectCard from './ProjectCard';

export default {
  components: {
    ProjectCard,
  },
};
</script>

<style></style>
