<template>
  <Layout>
    <div>
      <h1
        class="text-headline leading-none font-sans font-bold tracking-tight text-4xl sm:text-7xl mb-10"
      >
        {{ $page.post.title }}
      </h1>
      <h6 class="mb-10 text-lg">{{ $page.post.date }}</h6>
      <div class="prose prose-2xl" v-html="$page.post.content" />
    </div>
  </Layout>
</template>

<page-query>
query Post  ($id: ID!) {
  post (id: $id) {
    title
    content
    description
    date (format: "D MMMM YYYY")
    path
  }
  metadata {
    siteName
    siteUrl
  }
}
</page-query>

<script>
import getShareImage from '@jlengstorf/get-share-image';

export default {
  computed: {
    socialImage() {
      return getShareImage({
        title: this.$page.post.title,
        tagline: this.$page.post.description,
        cloudName: 'slawinski-dev',
        imagePublicID: 'social-image_dju5tn',
        font: 'helvetica',
        textLeftOffset: '0',
        titleLeftOffset: '50',
        titleBottomOffset: '300',
        titleExtraConfig: '_bold',
        taglineTopOffset: '400',
        taglineLeftOffset: '50',
      });
    },
  },
  metaInfo() {
    return {
      title: this.$page.post.title,
      link: [
        {
          key: `canonical`,
          rel: `canonical`,
          href: this.$page.metadata.siteUrl + this.$page.post.path,
        },
      ],
      meta: [
        {
          key: 'og:title',
          property: 'og:title',
          content: this.$page.post.title,
        },
        {
          key: 'og:description',
          property: 'og:description',
          content: this.$page.post.description,
        },
        {
          key: 'og:image',
          property: 'og:image',
          content: this.socialImage,
        },
        {
          key: 'twitter:title',
          name: 'twitter:title',
          content: this.$page.post.title,
        },
        {
          key: 'twitter:description',
          name: 'twitter:description',
          content: this.$page.post.description,
        },
        {
          key: 'twitter:image',
          name: 'twitter:image',
          content: this.socialImage,
        },
      ],
    };
  },
};
</script>

<style></style>
